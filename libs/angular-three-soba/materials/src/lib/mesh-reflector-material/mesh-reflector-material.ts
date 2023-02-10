import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input } from '@angular/core';
import {
    extend,
    getLocalState,
    injectBeforeRender,
    injectNgtRef,
    NgtArgs,
    NgtPush,
    NgtRenderState,
    NgtRxStore,
    NgtStore,
    startWithUndefined,
} from 'angular-three';
import { BlurPass, MeshReflectorMaterial } from 'angular-three-soba/shaders';
import { combineLatest, debounceTime, map } from 'rxjs';
import * as THREE from 'three';

extend({ MeshReflectorMaterial });

@Component({
    selector: 'ngts-mesh-reflector-material',
    standalone: true,
    template: `
        <ngt-mesh-reflector-material
            ngtCompound
            attach="material"
            *ngIf="defines$ | ngtPush as defines"
            [ref]="materialRef"
            [defines]="defines"
            [mirror]="reflectorProps.mirror"
            [textureMatrix]="reflectorProps.textureMatrix"
            [mixBlur]="reflectorProps.mixBlur"
            [tDiffuse]="reflectorProps.tDiffuse"
            [tDepth]="reflectorProps.tDepth"
            [tDiffuseBlur]="reflectorProps.tDiffuseBlur"
            [hasBlur]="reflectorProps.hasBlur"
            [mixStrength]="reflectorProps.mixStrength"
            [minDepthThreshold]="reflectorProps.minDepthThreshold"
            [maxDepthThreshold]="reflectorProps.maxDepthThreshold"
            [depthScale]="reflectorProps.depthScale"
            [depthToBlurRatioBias]="reflectorProps.depthToBlurRatioBias"
            [distortion]="reflectorProps.distortion"
            [distortionMap]="reflectorProps.distortionMap"
            [mixContrast]="reflectorProps.mixContrast"
        >
            <ng-content />
        </ngt-mesh-reflector-material>
    `,
    imports: [NgtArgs, NgtPush, NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshReflectorMaterial extends NgtRxStore {
    @Input() materialRef = injectNgtRef<MeshReflectorMaterial>();

    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }

    @Input() set mixBlur(mixBlur: number) {
        this.set({ mixBlur });
    }

    @Input() set mixStrength(mixStrength: number) {
        this.set({ mixStrength });
    }

    @Input() set blur(blur: [number, number] | number) {
        this.set({ blur });
    }

    @Input() set mirror(mirror: number) {
        this.set({ mirror });
    }

    @Input() set minDepthThreshold(minDepthThreshold: number) {
        this.set({ minDepthThreshold });
    }

    @Input() set maxDepthThreshold(maxDepthThreshold: number) {
        this.set({ maxDepthThreshold });
    }

    @Input() set depthScale(depthScale: number) {
        this.set({ depthScale });
    }

    @Input() set depthToBlurRatioBias(depthToBlurRatioBias: number) {
        this.set({ depthToBlurRatioBias });
    }

    @Input() set distortionMap(distortionMap: THREE.Texture) {
        this.set({ distortionMap });
    }

    @Input() set distortion(distortion: number) {
        this.set({ distortion });
    }

    @Input() set mixContrast(mixContrast: number) {
        this.set({ mixContrast });
    }

    @Input() set reflectorOffset(reflectorOffset: number) {
        this.set({ reflectorOffset });
    }

    readonly defines$ = this.select('reflectorEntities', 'reflectorProps', 'defines').pipe(debounceTime(0));

    get reflectorProps() {
        return this.get('reflectorEntities', 'reflectorProps');
    }

    private readonly store = inject(NgtStore);

    private readonly reflectorPlane = new THREE.Plane();
    private readonly normal = new THREE.Vector3();
    private readonly reflectorWorldPosition = new THREE.Vector3();
    private readonly cameraWorldPosition = new THREE.Vector3();
    private readonly rotationMatrix = new THREE.Matrix4();
    private readonly lookAtPosition = new THREE.Vector3(0, 0, -1);
    private readonly clipPlane = new THREE.Vector4();
    private readonly view = new THREE.Vector3();
    private readonly target = new THREE.Vector3();
    private readonly q = new THREE.Vector4();
    private readonly textureMatrix = new THREE.Matrix4();
    private readonly virtualCamera = new THREE.PerspectiveCamera();

    override initialize(): void {
        super.initialize();
        this.set({
            mixBlur: 0,
            mixStrength: 1,
            resolution: 256,
            blur: [0, 0],
            minDepthThreshold: 0.9,
            maxDepthThreshold: 1,
            depthScale: 0,
            depthToBlurRatioBias: 0.25,
            mirror: 0,
            distortion: 1,
            mixContrast: 1,
            reflectorOffset: 0,
        });
    }

    constructor() {
        super();

        this.connect(
            'normalizedBlur',
            this.select('blur').pipe(map((blur) => (Array.isArray(blur) ? blur : [blur, blur])))
        );
        this.connect('hasBlur', this.select('normalizedBlur').pipe(map(([x, y]) => x + y > 0)));
        this.connect(
            'reflectorEntities',
            combineLatest([
                this.store.select('gl'),
                this.select('normalizedBlur'),
                this.select('resolution'),
                this.select('mirror'),
                this.select('hasBlur'),
                this.select('mixBlur'),
                this.select('mixStrength'),
                this.select('minDepthThreshold'),
                this.select('maxDepthThreshold'),
                this.select('depthScale'),
                this.select('depthToBlurRatioBias'),
                this.select('distortion'),
                this.select('distortionMap').pipe(startWithUndefined()),
                this.select('mixContrast'),
            ]).pipe(
                map(
                    ([
                        gl,
                        blur,
                        resolution,
                        mirror,
                        hasBlur,
                        mixBlur,
                        mixStrength,
                        minDepthThreshold,
                        maxDepthThreshold,
                        depthScale,
                        depthToBlurRatioBias,
                        distortion,
                        distortionMap,
                        mixContrast,
                    ]) => {
                        const parameters = {
                            minFilter: THREE.LinearFilter,
                            magFilter: THREE.LinearFilter,
                            encoding: gl.outputEncoding,
                            type: THREE.HalfFloatType,
                        };
                        const fbo1 = new THREE.WebGLRenderTarget(resolution, resolution, parameters);
                        fbo1.depthBuffer = true;
                        fbo1.depthTexture = new THREE.DepthTexture(resolution, resolution);
                        fbo1.depthTexture.format = THREE.DepthFormat;
                        fbo1.depthTexture.type = THREE.UnsignedShortType;

                        const fbo2 = new THREE.WebGLRenderTarget(resolution, resolution, parameters);
                        const blurPass = new BlurPass({
                            gl,
                            resolution,
                            width: blur[0],
                            height: blur[1],
                            minDepthThreshold,
                            maxDepthThreshold,
                            depthScale,
                            depthToBlurRatioBias,
                        });
                        const reflectorProps = {
                            mirror,
                            textureMatrix: this.textureMatrix,
                            mixBlur,
                            tDiffuse: fbo1.texture,
                            tDepth: fbo1.depthTexture,
                            tDiffuseBlur: fbo2.texture,
                            hasBlur,
                            mixStrength,
                            minDepthThreshold,
                            maxDepthThreshold,
                            depthScale,
                            depthToBlurRatioBias,
                            distortion,
                            distortionMap,
                            mixContrast,
                            defines: {
                                USE_BLUR: hasBlur ? '' : undefined,
                                USE_DEPTH: depthScale > 0 ? '' : undefined,
                                USE_DISTORTION: distortionMap ? '' : undefined,
                            },
                        };

                        return { fbo1, fbo2, blurPass, reflectorProps };
                    }
                )
            )
        );

        injectBeforeRender(this.onBeforeRender.bind(this));
        console.log(this.materialRef);
    }

    private beforeRender(state: NgtRenderState) {
        const parent = getLocalState(this.materialRef.nativeElement).parent;
        if (!parent) return;

        const { camera } = state;

        this.reflectorWorldPosition.setFromMatrixPosition(parent.matrixWorld);
        this.cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
        this.rotationMatrix.extractRotation(parent.matrixWorld);
        this.normal.set(0, 0, 1);
        this.normal.applyMatrix4(this.rotationMatrix);
        this.reflectorWorldPosition.addScaledVector(this.normal, this.get('reflectorOffset'));
        this.view.subVectors(this.reflectorWorldPosition, this.cameraWorldPosition);
        // Avoid rendering when reflector is facing away
        if (this.view.dot(this.normal) > 0) return;
        this.view.reflect(this.normal).negate();
        this.view.add(this.reflectorWorldPosition);
        this.rotationMatrix.extractRotation(camera.matrixWorld);
        this.lookAtPosition.set(0, 0, -1);
        this.lookAtPosition.applyMatrix4(this.rotationMatrix);
        this.lookAtPosition.add(this.cameraWorldPosition);
        this.target.subVectors(this.reflectorWorldPosition, this.lookAtPosition);
        this.target.reflect(this.normal).negate();
        this.target.add(this.reflectorWorldPosition);
        this.virtualCamera.position.copy(this.view);
        this.virtualCamera.up.set(0, 1, 0);
        this.virtualCamera.up.applyMatrix4(this.rotationMatrix);
        this.virtualCamera.up.reflect(this.normal);
        this.virtualCamera.lookAt(this.target);
        this.virtualCamera.far = camera.far; // Used in WebGLBackground
        this.virtualCamera.updateMatrixWorld();
        this.virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
        // Update the texture matrix
        this.textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);
        this.textureMatrix.multiply(this.virtualCamera.projectionMatrix);
        this.textureMatrix.multiply(this.virtualCamera.matrixWorldInverse);
        this.textureMatrix.multiply(parent.matrixWorld);
        // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
        // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
        this.reflectorPlane.setFromNormalAndCoplanarPoint(this.normal, this.reflectorWorldPosition);
        this.reflectorPlane.applyMatrix4(this.virtualCamera.matrixWorldInverse);
        this.clipPlane.set(
            this.reflectorPlane.normal.x,
            this.reflectorPlane.normal.y,
            this.reflectorPlane.normal.z,
            this.reflectorPlane.constant
        );
        const projectionMatrix = this.virtualCamera.projectionMatrix;
        this.q.x = (Math.sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
        this.q.y = (Math.sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
        this.q.z = -1.0;
        this.q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
        // Calculate the scaled plane vector
        this.clipPlane.multiplyScalar(2.0 / this.clipPlane.dot(this.q));
        // Replacing the third row of the projection matrix
        projectionMatrix.elements[2] = this.clipPlane.x;
        projectionMatrix.elements[6] = this.clipPlane.y;
        projectionMatrix.elements[10] = this.clipPlane.z + 1.0;
        projectionMatrix.elements[14] = this.clipPlane.w;
    }

    private onBeforeRender(state: NgtRenderState) {
        if (!this.materialRef.nativeElement) return;
        const parent = getLocalState(this.materialRef.nativeElement).parent;
        if (!parent) return;

        const { gl, scene } = state;
        const { hasBlur } = this.get();
        const { fbo1, fbo2, blurPass } = this.get('reflectorEntities');

        if (fbo1 && fbo2 && blurPass) {
            parent.visible = false;
            const currentXrEnabled = gl.xr.enabled;
            const currentShadowAutoUpdate = gl.shadowMap.autoUpdate;
            this.beforeRender(state);
            gl.xr.enabled = false;
            gl.shadowMap.autoUpdate = false;
            gl.setRenderTarget(fbo1);
            gl.state.buffers.depth.setMask(true);
            if (!gl.autoClear) gl.clear();
            gl.render(scene, this.virtualCamera);
            if (hasBlur) blurPass.render(gl, fbo1, fbo2);
            gl.xr.enabled = currentXrEnabled;
            gl.shadowMap.autoUpdate = currentShadowAutoUpdate;
            parent.visible = true;
            gl.setRenderTarget(null);
        }
    }
}
