import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, NgtArgs, NgtStore, startWithUndefined } from 'angular-three';
import { SpotLightMaterial } from 'angular-three-soba/shaders';
import { combineLatest, map } from 'rxjs';
import * as THREE from 'three';
import { Mesh } from 'three';
import { NgtsSpotLightInput } from './spot-light-input';

extend({ Mesh });

@Component({
    selector: 'ngts-volumetric-mesh',
    standalone: true,
    template: `
        <ngt-mesh [ref]="mesh" [geometry]="get('geometry')" [raycast]="nullRaycast">
            <ngt-primitive *args="[material]" attach="material">
                <ngt-value [rawValue]="get('opacity')" attach="uniforms.opacity.value" />
                <ngt-value [rawValue]="get('color')" attach="uniforms.lightColor.value" />
                <ngt-value [rawValue]="get('attenuation')" attach="uniforms.attenuation.value" />
                <ngt-value [rawValue]="get('anglePower')" attach="uniforms.anglePower.value" />
                <ngt-value [rawvalue]="get('depthBuffer')" attach="uniforms.depth.value" />
                <ngt-value [rawvalue]="get('cameraNear')" attach="uniforms.cameraNear.value" />
                <ngt-value [rawvalue]="get('cameraFar')" attach="uniforms.cameraFar.value" />
                <ngt-value [rawvalue]="get('resolution')" attach="uniforms.resolution.value" />
            </ngt-primitive>
        </ngt-mesh>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsVolumetricMesh extends NgtsSpotLightInput {
    readonly mesh = injectNgtRef<THREE.Mesh>();
    readonly material = new SpotLightMaterial();
    readonly nullRaycast = () => null;

    private readonly vec = new THREE.Vector3();
    private readonly store = inject(NgtStore);

    override initialize(): void {
        super.initialize();
        this.set({ opacity: 1, color: 'white', distance: 5, angle: 0.15, attenuation: 5, anglePower: 5 });
    }

    constructor() {
        super();
        this.connect(
            'normalizedRadiusTop',
            this.select('radiusTop').pipe(
                startWithUndefined(),
                map((radiusTop) => (radiusTop === undefined ? 0.1 : radiusTop))
            )
        );
        this.connect(
            'normalizedRadiusBottom',
            combineLatest([this.select('radiusBottom').pipe(startWithUndefined()), this.select('angle')]).pipe(
                map(([radiusBottom, angle]) => (radiusBottom === undefined ? angle * 7 : radiusBottom))
            )
        );

        this.connect(
            'geometry',
            combineLatest([
                this.select('normalizedRadiusTop'),
                this.select('normalizedRadiusBottom'),
                this.select('distance'),
            ]).pipe(
                map(([radiusTop, radiusBottom, distance]) => {
                    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, distance, 128, 64, true);
                    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -distance / 2, 0));
                    geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
                    return geometry;
                })
            )
        );

        this.connect('cameraNear', this.store.select('camera').pipe(map((camera) => camera.near)));
        this.connect('cameraFar', this.store.select('camera').pipe(map((camera) => camera.far)));
        this.connect(
            'resolution',
            combineLatest([
                this.select('depthBuffer').pipe(startWithUndefined()),
                this.store.select('size'),
                this.store.select('viewport', 'dpr'),
            ]).pipe(map(([depthBuffer, size, dpr]) => (depthBuffer ? [size.width * dpr, size.height * dpr] : [0, 0])))
        );

        injectBeforeRender(() => {
            this.material.uniforms['spotPosition'].value.copy(this.mesh.nativeElement.getWorldPosition(this.vec));
            this.mesh.nativeElement.lookAt(
                (this.mesh.nativeElement.parent as THREE.SpotLight).target.getWorldPosition(this.vec)
            );
        });
    }
}
