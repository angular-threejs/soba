import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta, moduleMetadata, StoryFn, StoryObj } from '@storybook/angular';
import { NgtArgs, NgtBeforeRenderEvent } from 'angular-three';
import { NgtsContactShadows } from 'angular-three-soba/staging';
import { StorybookSetup } from '../setup-canvas';

@Component({
    standalone: true,
    template: `
        <ngt-mesh [position]="[0, 2, 0]" (beforeRender)="onBeforeRender($any($event))">
            <ngt-sphere-geometry *args="[1, 32, 32]" />
            <ngt-mesh-toon-material #material color="#2a8aff" />
        </ngt-mesh>
        <ngts-contact-shadows
            [position]="[0, 0, 0]"
            [scale]="10"
            [far]="3"
            [blur]="3"
            [rotation]="[Math.PI / 2, 0, 0]"
            [color]="colorized ? material.color : 'black'"
        />
        <ngt-mesh [position]="[0, -0.01, 0]" [rotation]="[-Math.PI / 2, 0, 0]">
            <ngt-plane-geometry *args="[10, 10]" />
            <ngt-mesh-toon-material />
        </ngt-mesh>
    `,
    imports: [NgtsContactShadows, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultContactShadowsStory {
    @Input() colorized = false;
    readonly Math = Math;

    onBeforeRender({ state: { clock }, object: mesh }: NgtBeforeRenderEvent<THREE.Mesh>) {
        mesh.position.y = Math.sin(clock.getElapsedTime()) + 2;
    }
}

export default {
    title: 'Staging/Contact Shadows',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default: StoryFn = () => ({
    props: { story: DefaultContactShadowsStory },
    template: `
<storybook-setup [story]="story" />
  `,
});

export const Colorized: StoryObj = {
    render: (args) => ({
        props: { story: DefaultContactShadowsStory, inputs: args },
        template: `
    <storybook-setup [story]="story" [inputs]="inputs" />
      `,
    }),
    args: { colorized: true },
};
