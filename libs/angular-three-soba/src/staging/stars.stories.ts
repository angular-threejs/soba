import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Meta, moduleMetadata, StoryFn } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsStars } from 'angular-three-soba/staging';
import { StorybookSetup } from '../setup-canvas';

@Component({
    standalone: true,
    template: `
        <ngt-mesh [rotation]="[Math.PI / 2, 0, 0]">
            <ngt-plane-geometry *args="[100, 100, 4, 4]" />
            <ngt-mesh-basic-material color="black" [wireframe]="true" />
        </ngt-mesh>
        <ngt-axes-helper />
        <ngts-stars />
    `,
    imports: [NgtsStars, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultStarsStory {
    readonly Math = Math;
}

export default {
    title: 'Staging/Stars',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default: StoryFn = () => ({
    props: { story: DefaultStarsStory },
    template: `
<storybook-setup [story]="story" />
    `,
});
