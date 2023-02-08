import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import {
    extend,
    injectBeforeRender,
    injectNgtRef,
    NgtArgs,
    NgtPortal,
    NgtPortalContent,
    NgtRef,
    NgtRenderState,
    prepare,
} from 'angular-three';
import { combineLatest } from 'rxjs';
import * as THREE from 'three';
import { CubeCamera, HalfFloatType } from 'three';
import { NgtsEnvironmentCube } from './environment-cube';
import { NgtsEnvironmentInputs } from './environment-inputs';
import { NgtsEnvironmentMap } from './environment-map';
import { setEnvProps } from './utils';

extend({ CubeCamera });

@Component({
    selector: 'ngts-environment-portal',
    standalone: true,
    template: `
        <ngt-portal [container]="virtualSceneRef">
            <ng-template ngtPortalContent>
                <ng-content />
                <ng-container *args="get('cameraArgs')">
                    <ngt-cube-camera *ref="cubeCameraRef" />
                </ng-container>
                <ng-container *ngIf="get('files') || get('preset'); else environmentMap">
                    <ngts-environment-cube
                        [background]="true"
                        [files]="get('files')"
                        [preset]="get('preset')"
                        [path]="get('path')"
                        [extensions]="get('extensions')"
                    />
                </ng-container>
                <ng-template #environmentMap>
                    <ngts-environment-map [background]="true" [map]="get('map')" [extensions]="get('extensions')" />
                </ng-template>
            </ng-template>
        </ngt-portal>
    `,
    imports: [NgtPortal, NgtPortalContent, NgtsEnvironmentMap, NgtsEnvironmentCube, NgIf, NgtArgs, NgtRef],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsEnvironmentPortal extends NgtsEnvironmentInputs implements OnInit {
    readonly virtualSceneRef = injectNgtRef<THREE.Scene>(prepare(new THREE.Scene()));
    readonly cubeCameraRef = injectNgtRef<THREE.CubeCamera>();

    override initialize(): void {
        super.initialize();
        this.set({ near: 1, far: 1000, resolution: 256, frames: 1, background: false, preset: undefined });
        this.connect(
            'fbo',
            this.select(['resolution'], ({ resolution }) => {
                const fbo = new THREE.WebGLCubeRenderTarget(resolution);
                fbo.texture.type = HalfFloatType;
                return fbo;
            })
        );
        this.connect(
            'cameraArgs',
            this.select(['fbo', 'near', 'far'], ({ near, far, fbo }) => [near, far, fbo])
        );
    }

    constructor() {
        super();
        injectBeforeRender(this.onBeforeRender.bind(this, 1));
    }

    ngOnInit(): void {
        this.setEnvProps();
    }

    private setEnvProps() {
        this.effect(
            combineLatest([
                this.store.select('gl'),
                this.store.select('scene'),
                this.select('fbo'),
                this.select('scene'),
                this.select('background'),
                this.select('frames'),
                this.select('blur'),
                this.virtualSceneRef.$,
                this.cubeCameraRef.$,
            ]),
            ([gl, defaultScene, fbo, scene, background, frames, blur, virtualScene, camera]) => {
                if (frames === 1) camera.update(gl, virtualScene);
                return setEnvProps(background, scene, defaultScene, fbo.texture, blur);
            }
        );
    }

    private onBeforeRender(count: number, { gl }: NgtRenderState) {
        const { frames } = this.get();
        if (frames === Infinity || count < frames) {
            if (this.cubeCameraRef.nativeElement) {
                this.cubeCameraRef.nativeElement.update(gl, this.virtualSceneRef.nativeElement);
                count++;
            }
        }
    }
}
