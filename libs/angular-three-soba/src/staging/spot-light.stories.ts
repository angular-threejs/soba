import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, OnInit } from '@angular/core';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { checkUpdate, createRunInContext, NgtArgs, NgtInjectedRef, NgtPush, NgtRxStore, NgtStore } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';
import { injectNgtsDepthBuffer, NgtsDepthBufferParams } from 'angular-three-soba/misc';
import { NgtsEnvironment, NgtsSpotLight, NgtsSpotLightShadow } from 'angular-three-soba/staging';
import { map, tap } from 'rxjs';
import * as THREE from 'three';
import { makeCanvasOptions, StorybookSetup } from '../setup-canvas';
// @ts-ignore

// TODO(chau): investigate why ngIf doesn't work

@Component({
    standalone: true,
    template: `
        <ngts-orbit-controls
            [makeDefault]="true"
            [autoRotate]="true"
            [autoRotateSpeed]="0.5"
            [minDistance]="2"
            [maxDistance]="10"
        />
        <ngts-perspective-camera [near]="0.01" [far]="50" [position]="[1, 3, 1]" [makeDefault]="true" [fov]="60" />
        <ngts-environment preset="sunset" />

        <ngt-hemisphere-light *args="['#ffffbb', '#080820', 1]" />

        <ngt-mesh *ngIf="textures$ | ngtPush as textures" [rotation]="[-Math.PI / 2, 0, 0]" [receiveShadow]="true">
            <ngt-circle-geometry *args="[5, 64, 64]" />
            <ngt-mesh-standard-material
                [map]="textures.diffuse"
                [normalMap]="textures.normal"
                [roughnessMap]="textures.roughness"
                [aoMap]="textures.ao"
                [envMapIntensity]="0.2"
            />
        </ngt-mesh>

        <ngts-spot-light
            [distance]="20"
            [intensity]="5"
            [angle]="MathUtils.degToRad(45)"
            [color]="'#fadcb9'"
            [position]="[5, 7, -2]"
            [volumetric]="false"
            [debug]="debug"
        >
            <ngts-spot-light-shadow
                [scale]="4"
                [distance]="0.4"
                [width]="2048"
                [height]="2048"
                [map]="leaf$ | ngtPush"
                [shader]="wind ? shader : null"
            />
        </ngts-spot-light>
    `,
    imports: [
        NgtsSpotLight,
        NgtsSpotLightShadow,
        NgIf,
        NgtArgs,
        NgtPush,
        NgtsOrbitControls,
        NgtsPerspectiveCamera,
        NgtsEnvironment,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class ShadowsSpotLightStory {
    @Input() debug = false;
    @Input() wind = false;

    readonly Math = Math;
    readonly MathUtils = THREE.MathUtils;

    readonly shader = /* glsl */ `
            varying vec2 vUv;
            uniform sampler2D uShadowMap;
            uniform float uTime;
            void main() {
              // material.repeat.set(2.5) - Since repeat is a shader feature not texture
              // we need to implement it manually
              vec2 uv = mod(vUv, 0.4) * 2.5;
              // Fake wind distortion
              uv.x += sin(uv.y * 10.0 + uTime * 0.5) * 0.02;
              uv.y += sin(uv.x * 10.0 + uTime * 0.5) * 0.02;
              vec3 color = texture2D(uShadowMap, uv).xyz;
              gl_FragColor = vec4(color, 1.);
            }
          `;

    readonly textures$ = injectNgtsTextureLoader({
        diffuse: '/soba/textures/grassy_cobble/grassy_cobblestone_diff_2k.jpg',
        normal: '/soba/textures/grassy_cobble/grassy_cobblestone_nor_gl_2k.jpg',
        roughness: '/soba/textures/grassy_cobble/grassy_cobblestone_rough_2k.jpg',
        ao: '/soba/textures/grassy_cobble/grassy_cobblestone_ao_2k.jpg',
    }).pipe(
        tap((textures) => {
            for (const texture of Object.values(textures)) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(2, 2);
                checkUpdate(texture);
            }
        })
    );

    readonly leaf$ = injectNgtsTextureLoader('/soba/textures/other/leaves.jpg');

    readonly store = inject(NgtStore);

    ngOnInit() {
        console.log(this.store.get('scene'));
    }
}

@Component({
    standalone: true,
    template: `
        <ng-container *ngIf="depthBuffer.nativeElement">
            <ngts-spot-light
                [penumbra]="0.5"
                [depthBuffer]="depthBuffer.nativeElement"
                [position]="[3, 2, 0]"
                [intensity]="0.5"
                [angle]="0.5"
                [color]="'#ff005b'"
                [castShadow]="true"
                [debug]="debug"
                [volumetric]="volumetric"
            />

            <ngts-spot-light
                [penumbra]="0.5"
                [depthBuffer]="depthBuffer.nativeElement"
                [position]="[-3, 2, 0]"
                [intensity]="0.5"
                [angle]="0.5"
                [color]="'#0eec82'"
                [castShadow]="true"
                [debug]="debug"
                [volumetric]="volumetric"
            />
        </ng-container>

        <ngt-mesh [position]="[0, 0.5, 0]" [castShadow]="true">
            <ngt-box-geometry />
            <ngt-mesh-phong-material />
        </ngt-mesh>

        <ngt-mesh [receiveShadow]="true" [rotation]="[-Math.PI / 2, 0, 0]">
            <ngt-plane-geometry *args="[100, 100]" />
            <ngt-mesh-phong-material />
        </ngt-mesh>
    `,
    imports: [NgtsSpotLight, NgIf, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultSpotLightStory extends NgtRxStore implements OnInit {
    readonly Math = Math;

    @Input() set size(size: number) {
        this.set({ size });
    }

    @Input() debug = false;
    @Input() volumetric = true;

    override initialize(): void {
        super.initialize();
        this.set({ size: 256 });
    }

    readonly runInContext = createRunInContext();

    depthBuffer!: NgtInjectedRef<THREE.DepthTexture>;

    ngOnInit() {
        this.depthBuffer = this.runInContext(() => {
            return injectNgtsDepthBuffer(({ frames }) =>
                this.select('size').pipe(map((size) => ({ size, frames } as NgtsDepthBufferParams)))
            );
        });
    }
}

export default {
    title: 'Staging/SpotLight',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default: StoryObj = {
    render: (args) => ({
        props: { story: DefaultSpotLightStory, options: makeCanvasOptions({ lights: false }), inputs: args },
        template: `
<storybook-setup [story]="story" [options]="options" [inputs]="inputs" />
        `,
    }),
    args: { size: 256, debug: false, volumetric: true },
};

export const Shadows: StoryObj = {
    render: (args) => ({
        props: { story: ShadowsSpotLightStory, options: makeCanvasOptions({ lights: false }), inputs: args },
        template: `
<storybook-setup [story]="story" [options]="options" [inputs]="inputs" />
        `,
    }),
    args: { debug: false, wind: false },
};
