import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta, moduleMetadata, StoryFn, StoryObj } from '@storybook/angular';
import { injectBeforeRender, injectNgtRef, NgtArgs } from 'angular-three';
import { NgtsMeshWobbleMaterial } from 'angular-three-soba/materials';
import { MeshWobbleMaterial } from 'angular-three-soba/shaders';
import { StorybookSetup } from '../setup-canvas';

@Component({
    standalone: true,
    template: `
        <ngt-mesh>
            <ngts-mesh-wobble-material color="#f25042" [materialRef]="ref" />
            <ngt-torus-geometry *args="[1, 0.25, 16, 100]" />
        </ngt-mesh>
    `,
    imports: [NgtsMeshWobbleMaterial, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class RefMeshWobbleMaterialStory {
    readonly ref = injectNgtRef<MeshWobbleMaterial>();

    constructor() {
        injectBeforeRender(({ clock }) => {
            this.ref.nativeElement.factor = Math.abs(Math.sin(clock.getElapsedTime())) * 2;
            //   this.ref.nativeElement.speed = Math.abs(Math.sin(clock.getElapsedTime())) * 10;
        });
    }
}

@Component({
    standalone: true,
    template: `
        <ngt-mesh>
            <ngts-mesh-wobble-material color="#f25042" [speed]="speed" [factor]="factor" />
            <ngt-torus-geometry *args="[1, 0.25, 16, 100]" />
        </ngt-mesh>
    `,
    imports: [NgtsMeshWobbleMaterial, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultMeshWobbleMaterialStory {
    @Input() speed = 1;
    @Input() factor = 0.6;
}

export default {
    title: 'Shaders/MeshWobbleMaterial',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default: StoryObj = {
    render: (args) => ({
        props: { story: DefaultMeshWobbleMaterialStory, inputs: args },
        template: `
<storybook-setup [story]="story" [inputs]="inputs" />
    `,
    }),
    args: { speed: 1, factor: 0.6 },
};

export const Ref: StoryFn = () => ({
    props: { story: RefMeshWobbleMaterialStory },
    template: `
<storybook-setup [story]="story" />
    `,
});
