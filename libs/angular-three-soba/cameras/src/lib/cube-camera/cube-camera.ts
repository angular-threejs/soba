import { NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, ContentChild, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, NgtArgs, NgtRxStore, NgtStore } from 'angular-three';
import { combineLatest, map } from 'rxjs';
import * as THREE from 'three';
import { CubeCamera, Group } from 'three';
import { NgtsCameraContent } from '../camera/camera-content';

extend({ Group, CubeCamera });

@Component({
    selector: 'ngts-cube-camera',
    standalone: true,
    template: `
        <ngt-group ngtCompound>
            <ngt-cube-camera [ref]="cameraRef" *args="get('cameraArgs')" />
            <ngt-group #group>
                <ng-container
                    *ngIf="cameraContent && cameraContent.ngtsCameraContent && get('fbo')"
                    [ngTemplateOutlet]="cameraContent.template"
                    [ngTemplateOutletContext]="{ fbo: get('fbo').texture, group }"
                />
            </ngt-group>
        </ngt-group>
    `,
    imports: [NgIf, NgTemplateOutlet, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCubeCamera extends NgtRxStore {
    @ViewChild('group', { static: true }) groupRef!: ElementRef<THREE.Group>;
    @ContentChild(NgtsCameraContent) cameraContent?: NgtsCameraContent;

    readonly cameraRef = injectNgtRef<THREE.CubeCamera>();

    /** Number of frames to render, Infinity */
    @Input() set frames(frames: number) {
        this.set({ frames });
    }
    /** Resolution of the FBO, 256 */
    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }
    /** Camera near, 0.1 */
    @Input() set near(near: number) {
        this.set({ near });
    }
    /** Camera far, 1000 */
    @Input() set far(far: number) {
        this.set({ far });
    }
    /** Custom environment map that is temporarily set as the scenes background */
    @Input() set envMap(envMap: THREE.Texture) {
        this.set({ envMap });
    }
    /** Custom fog that is temporarily set as the scenes fog */
    @Input() set fog(fog: THREE.Fog | THREE.FogExp2) {
        this.set({ fog });
    }

    private readonly store = inject(NgtStore);

    override initialize(): void {
        super.initialize();
        this.set({
            frames: Infinity,
            resolution: 256,
            near: 0.1,
            far: 1000,
        });
    }

    constructor() {
        super();
        this.connect(
            'fbo',
            this.select('resolution').pipe(
                map((resolution) => {
                    const fbo = new THREE.WebGLCubeRenderTarget(resolution);
                    fbo.texture.encoding = this.store.get('gl').outputEncoding;
                    fbo.texture.type = THREE.HalfFloatType;
                    return fbo;
                })
            )
        );
        this.connect('cameraArgs', combineLatest([this.select('near'), this.select('far'), this.select('fbo')]));

        let count = 0;
        let originalFog: THREE.Scene['fog'];
        let originalBackground: THREE.Scene['background'];
        injectBeforeRender(({ scene, gl }) => {
            const { frames, envMap, fog } = this.get();
            if (
                envMap &&
                this.cameraRef.nativeElement &&
                this.groupRef.nativeElement &&
                (frames === Infinity || count < frames)
            ) {
                this.groupRef.nativeElement.visible = false;
                originalFog = scene.fog;
                originalBackground = scene.background;
                scene.background = envMap || originalBackground;
                scene.fog = fog || originalFog;
                this.cameraRef.nativeElement.update(gl, scene);
                scene.fog = originalFog;
                scene.background = originalBackground;
                this.groupRef.nativeElement.visible = true;
                count++;
            }
        });
    }
}
