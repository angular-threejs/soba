import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta, moduleMetadata, StoryFn, StoryObj } from '@storybook/angular';
import { injectBeforeRender, injectNgtRef, NgtArgs } from 'angular-three';
import { NgtsMeshDistortMaterial } from 'angular-three-soba/materials';
import { MeshDistortMaterial, provideDistortMaterialShader } from 'angular-three-soba/shaders';
import { StorybookSetup } from '../setup-canvas';
// @ts-ignore
import distort from '../../shaders/src/assets/distort.vert.glsl';

@Component({
    standalone: true,
    template: `
        <ngt-mesh>
            <ngts-mesh-distort-material color="#f25042" [materialRef]="ref" />
            <ngt-icosahedron-geometry *args="[1, 4]" />
        </ngt-mesh>
    `,
    imports: [NgtsMeshDistortMaterial, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class RefMeshDistortMaterialStory {
    readonly ref = injectNgtRef<InstanceType<MeshDistortMaterial>>();

    constructor() {
        injectBeforeRender(({ clock }) => {
            this.ref.nativeElement.distort = Math.sin(clock.getElapsedTime());
        });
    }
}

@Component({
    standalone: true,
    template: `
        <ngt-mesh>
            <ngts-mesh-distort-material color="#f25042" [speed]="speed" [distort]="distort" [radius]="radius" />
            <ngt-icosahedron-geometry *args="[1, 4]" />
        </ngt-mesh>
    `,
    imports: [NgtsMeshDistortMaterial, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultMeshDistortMaterialStory {
    @Input() speed = 1;
    @Input() distort = 0.6;
    @Input() radius = 1;
}

export default {
    title: 'Shaders/MeshDistortMaterial',
    decorators: [
        moduleMetadata({
            imports: [StorybookSetup],
            providers: [provideDistortMaterialShader(distort)],
        }),
    ],
} as Meta;

export const Default: StoryObj = {
    render: (args) => ({
        props: { story: DefaultMeshDistortMaterialStory, inputs: args },
        template: `
<storybook-setup [story]="story" [inputs]="inputs" />
    `,
    }),
    args: { speed: 1, distort: 0.6, radius: 1 },
};

export const Ref: StoryFn = () => ({
    props: { story: RefMeshDistortMaterialStory },
    template: `
<storybook-setup [story]="story" />
    `,
});
