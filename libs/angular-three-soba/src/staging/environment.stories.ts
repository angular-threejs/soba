import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsContactShadows, NgtsEnvironment, ngtsEnvironmentPresetsObj } from 'angular-three-soba/staging';
import { makeCanvasOptions, StorybookSetup } from '../setup-canvas';

const presets = Object.keys(ngtsEnvironmentPresetsObj);

@Component({
    standalone: true,
    template: `
        <ngts-environment [ground]="{height, radius}" [preset]="preset" />
        <ngt-mesh [position]="[0, 5, 0]">
            <ngt-box-geometry *args="[10, 10, 10]" />
            <ngt-mesh-standard-material metalness="1" roughness="0" />
        </ngt-mesh>
        <ngts-contact-shadows
            [resolution]="1024"
            [position]="[0, 0, 0]"
            [scale]="100"
            [blur]="2"
            [opacity]="1"
            [far]="10"
        />
        <ngts-orbit-controls [autoRotate]="true" />
        <ngts-perspective-camera [position]="[40, 40, 40]" [makeDefault]="true" />
    `,
    imports: [NgtsEnvironment, NgtsOrbitControls, NgtsPerspectiveCamera, NgtsContactShadows, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class GroundEnvironmentStory {
    @Input() preset = 'park';
    @Input() height = 15;
    @Input() radius = 60;
}

@Component({
    standalone: true,
    template: `
        <ngts-environment
            [background]="background"
            [path]="'soba/cube/'"
            [files]="['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']"
        />
        <ngt-mesh>
            <ngt-torus-knot-geometry *args="[1, 0.5, 128, 32]" />
            <ngt-mesh-standard-material [metalness]="1" [roughness]="0" />
        </ngt-mesh>
        <ngts-orbit-controls [autoRotate]="true" />
    `,
    imports: [NgtsEnvironment, NgtsOrbitControls, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class FilesEnvironmentStory {
    @Input() background = true;
}

@Component({
    standalone: true,
    template: `
        <ngts-environment [background]="background" [preset]="preset" [blur]="blur" />
        <ngt-mesh>
            <ngt-torus-knot-geometry *args="[1, 0.5, 128, 32]" />
            <ngt-mesh-standard-material [metalness]="1" [roughness]="0" />
        </ngt-mesh>
        <ngts-orbit-controls [autoRotate]="true" />
    `,
    imports: [NgtsEnvironment, NgtsOrbitControls, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultEnvironmentStory {
    @Input() background = true;
    @Input() preset = presets[0];
    @Input() blur = 0;
}

export default {
    title: 'Staging/Environment',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default: StoryObj = {
    render: (args) => ({
        props: {
            story: DefaultEnvironmentStory,
            options: makeCanvasOptions({ controls: false, camera: { position: [0, 0, 10] } }),
            inputs: args,
        },
        template: `
    <storybook-setup [options]="options" [story]="story" [inputs]="inputs" />
        `,
    }),

    args: {
        background: true,
        blur: 0,
        preset: presets[0],
    },

    argTypes: {
        preset: { options: presets, control: { type: 'select' } },
        blur: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    },
};

export const Files: StoryObj = {
    render: (args) => ({
        props: {
            story: FilesEnvironmentStory,
            options: makeCanvasOptions({ controls: false, camera: { position: [0, 0, 10] } }),
            inputs: args,
        },
        template: `
    <storybook-setup [options]="options" [story]="story" [inputs]="inputs" />
        `,
    }),

    args: {
        background: true,
    },
};

export const Ground: StoryObj = {
    render: (args) => ({
        props: {
            story: GroundEnvironmentStory,
            options: makeCanvasOptions({ controls: false, camera: { position: [0, 0, 10] } }),
            inputs: args,
        },
        template: `
    <storybook-setup [options]="options" [story]="story" [inputs]="inputs" />
    `,
    }),
    args: { height: 15, radius: 60, preset: 'park' },
    argTypes: {
        preset: { options: presets, control: { type: 'select' } },
        height: { control: { type: 'range', min: 0, max: 50, step: 0.1 } },
        radius: { control: { type: 'range', min: 0, max: 200, step: 1 } },
    },
};
