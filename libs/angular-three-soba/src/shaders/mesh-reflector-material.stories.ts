import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, Input, ViewChild } from '@angular/core';
import { Meta, moduleMetadata, StoryFn } from '@storybook/angular';
import { injectBeforeRender, NgtArgs, NgtPush, NgtRxStore, startWithUndefined } from 'angular-three';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';
import { NgtsMeshReflectorMaterial } from 'angular-three-soba/materials';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { map } from 'rxjs';
import * as THREE from 'three';
import { makeCanvasOptions, StorybookSetup } from '../setup-canvas';

@Component({
    selector: 'default-scene',
    standalone: true,
    template: `
        <ngt-mesh [rotation]="[-Math.PI / 2, 0, Math.PI / 2]">
            <ngt-plane-geometry *args="[10, 10]" />
            <ngts-mesh-reflector-material
                color="#a0a0a0"
                [resolution]="1024"
                [mirror]="0.75"
                [mixBlur]="10"
                [mixStrength]="2"
                [blur]="get('blur') || [0, 0]"
                [minDepthThreshold]="0.8"
                [maxDepthThreshold]="1.2"
                [depthScale]="get('depthScale') || 0"
                [depthToBlurRatioBias]="0.2"
                [debug]="0"
                [distortion]="get('distortion') || 0"
                [distortionMap]="distortionMap$ | ngtPush"
                [metalness]="0.5"
                [roughnessMap]="roughness$ | ngtPush"
                [roughness]="1"
                [normalMap]="normal$ | ngtPush"
                [normalScale]="get('normalScaleVector')"
                [reflectorOffset]="get('reflectorOffset')"
            />
        </ngt-mesh>
        <ngt-mesh [position]="[0, 1.6, -3]">
            <ngt-box-geometry *args="[2, 3, 0.2]" />
            <ngt-mesh-physical-material color="hotpink" />
        </ngt-mesh>
        <ngt-mesh #torus [position]="[0, 1, 0]">
            <ngt-torus-knot-geometry *args="[0.5, 0.2, 128, 32]" />
            <ngt-mesh-physical-material color="hotpink" />
        </ngt-mesh>
        <ngt-spot-light [position]="[10, 6, 10]" [penumbra]="1" [angle]="0.3" />
        <ngts-environment preset="city" />
    `,
    imports: [NgtsMeshReflectorMaterial, NgtsEnvironment, NgtArgs, NgtPush],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Scene extends NgtRxStore {
    readonly Math = Math;

    @Input() set blur(blur: [number, number]) {
        this.set({ blur });
    }

    @Input() set depthScale(depthScale: number) {
        this.set({ depthScale });
    }

    @Input() set distortion(distortion: number) {
        this.set({ distortion });
    }

    @Input() set normalScale(normalScale: number) {
        this.set({ normalScale });
    }

    @Input() set reflectorOffset(reflectorOffset: number) {
        this.set({ reflectorOffset });
    }

    readonly roughness$ = injectNgtsTextureLoader('soba/roughness_floor.jpeg');
    readonly normal$ = injectNgtsTextureLoader('soba/NORM.jpg');
    readonly distortionMap$ = injectNgtsTextureLoader('soba/dist_map.jpeg');

    @ViewChild('torus', { static: true }) torus!: ElementRef<THREE.Mesh>;

    constructor() {
        super();
        this.connect(
            'normalScaleVector',
            this.select('normalScale').pipe(
                startWithUndefined(),
                map((normalScale) => new THREE.Vector2(normalScale || 0))
            )
        );
        this.hold(this.distortionMap$, (distortionMap) => {
            distortionMap.wrapS = distortionMap.wrapT = THREE.RepeatWrapping;
            distortionMap.repeat.set(4, 4);
        });

        injectBeforeRender(({ clock }) => {
            if (this.torus?.nativeElement) {
                this.torus.nativeElement.position.y += Math.sin(clock.getElapsedTime()) / 25;
                this.torus.nativeElement.rotation.y = clock.getElapsedTime() / 2;
            }
        });
    }
}

@Component({
    standalone: true,
    template: `
        <default-scene [reflectorOffset]="1" />
    `,
    imports: [Scene],
})
class OffsetMapMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: `
        <default-scene [normalScale]="0.5" />
    `,
    imports: [Scene],
})
class NormalMapMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: `
        <default-scene [distortion]="1" />
    `,
    imports: [Scene],
})
class DistortionMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: `
        <default-scene [depthScale]="2" />
    `,
    imports: [Scene],
})
class DepthMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: `
        <default-scene [blur]="[500, 500]" />
    `,
    imports: [Scene],
})
class BlurMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: `
        <default-scene />
    `,
    imports: [Scene],
})
class PlainMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: `
        <default-scene [blur]="[100, 500]" [depthScale]="2" [distortion]="0.3" [normalScale]="0.5" />
    `,
    imports: [Scene],
})
class DefaultMeshReflectorMaterialStory {}

export default {
    title: 'Shaders/MeshReflectorMaterial',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

const props = {
    options: makeCanvasOptions({ camera: { fov: 20, position: [-6, 6, 15] } }),
};

export const Default: StoryFn = () => ({
    props: { ...props, story: DefaultMeshReflectorMaterialStory },
    template: `
<storybook-setup [options]="options" [story]="story" [inputs]="inputs" />
    `,
});

export const Plain: StoryFn = () => ({
    props: { ...props, story: PlainMeshReflectorMaterialStory },
    template: `
<storybook-setup [options]="options" [story]="story" />
    `,
});

export const Blur: StoryFn = () => ({
    props: { ...props, story: BlurMeshReflectorMaterialStory },
    template: `
<storybook-setup [options]="options" [story]="story" [inputs]="inputs" />
    `,
});

export const Depth: StoryFn = () => ({
    props: { ...props, story: DepthMeshReflectorMaterialStory },
    template: `
<storybook-setup [options]="options" [story]="story" [inputs]="inputs" />
    `,
});

export const Distortion: StoryFn = () => ({
    props: { ...props, story: DistortionMeshReflectorMaterialStory },
    template: `
<storybook-setup [options]="options" [story]="story" [inputs]="inputs" />
    `,
});

export const NormalMap: StoryFn = () => ({
    props: { ...props, story: NormalMapMeshReflectorMaterialStory },
    template: `
<storybook-setup [options]="options" [story]="story" [inputs]="inputs" />
    `,
});

export const Offset: StoryFn = () => ({
    props: { ...props, story: OffsetMapMeshReflectorMaterialStory },
    template: ` <storybook-setup [options]="options" [story]="story" [inputs]="inputs" />
    `,
});
