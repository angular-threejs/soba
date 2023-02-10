import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Meta, moduleMetadata, StoryFn } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsDetailed } from 'angular-three-soba/performance';
import { makeCanvasOptions, StorybookSetup } from '../setup-canvas';

@Component({
    standalone: true,
    template: `
        <ngts-detailed [distances]="[0, 50, 150]">
            <ngt-mesh>
                <ngt-icosahedron-geometry *args="[10, 3]" />
                <ngt-mesh-basic-material color="hotpink" [wireframe]="true" />
            </ngt-mesh>

            <ngt-mesh>
                <ngt-icosahedron-geometry *args="[10, 2]" />
                <ngt-mesh-basic-material color="lightgreen" [wireframe]="true" />
            </ngt-mesh>

            <ngt-mesh>
                <ngt-icosahedron-geometry *args="[10, 1]" />
                <ngt-mesh-basic-material color="lightblue" [wireframe]="true" />
            </ngt-mesh>
        </ngts-detailed>
        <ngts-orbit-controls [enablePan]="false" [enableRotate]="false" [zoomSpeed]="0.5" />
    `,
    imports: [NgtsDetailed, NgtsOrbitControls, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultDetailedStory {}

export default {
    title: 'Performance/Detailed',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default: StoryFn = () => ({
    props: {
        story: DefaultDetailedStory,
        options: makeCanvasOptions({ controls: false, camera: { position: [0, 0, 100] } }),
    },
    template: `
<storybook-setup [story]="story" [options]="options" />
  `,
});
