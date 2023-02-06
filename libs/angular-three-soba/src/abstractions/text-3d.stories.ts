import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { extend } from 'angular-three';
import { NgtsText3D } from 'angular-three-soba/abstractions';
import { NgtsCenter, NgtsFloat } from 'angular-three-soba/staging';
import { MeshNormalMaterial } from 'three';
import { makeCanvasOptions, StorybookSetup } from '../setup-canvas';

extend({ MeshNormalMaterial });

@Component({
    standalone: true,
    template: `
        <ngts-center>
            <ngts-float [floatIntensity]="5" [speed]="2">
                <ngts-text-3d
                    font="soba/helvetiker_regular.typeface.json"
                    [bevelEnabled]="true"
                    [bevelSize]="0.05"
                    [text]="text"
                >
                    <ngt-mesh-normal-material />
                </ngts-text-3d>
            </ngts-float>
        </ngts-center>
    `,
    imports: [NgtsCenter, NgtsFloat, NgtsText3D],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultText3DStory {
    @Input() text = 'Angular Three';
}

export default {
    title: 'Abstractions/Text 3D',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default: Story = (args) => ({
    props: { options: makeCanvasOptions({ camera: { position: [0, 0, 5] } }), story: DefaultText3DStory, inputs: args },
    template: `
<storybook-setup [options]="options" [story]="story" [inputs]="inputs" />
    `,
});

Default.args = {
    text: 'Angular Three',
};
