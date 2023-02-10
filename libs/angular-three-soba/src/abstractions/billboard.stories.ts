import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsBillboard, NgtsText } from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { BoxGeometry, ConeGeometry, PlaneGeometry } from 'three';
import { makeCanvasOptions, StorybookSetup } from '../setup-canvas';

@Component({
    selector: 'BillboardCone',
    standalone: true,
    template: `
        <ngt-mesh>
            <ngt-cone-geometry *args="args" />
            <ngt-value attach="material.color" [rawValue]="color" />
            <ng-content />
        </ngt-mesh>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Cone {
    @Input() args: ConstructorParameters<typeof ConeGeometry> = [];
    @Input() color = 'white';
}

@Component({
    selector: 'BillboardBox',
    standalone: true,
    template: `
        <ngt-mesh ngtCompound>
            <ngt-box-geometry *args="args" />
            <ngt-value attach="material.color" [rawValue]="color" />
            <ng-content />
        </ngt-mesh>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Box {
    @Input() args: ConstructorParameters<typeof BoxGeometry> = [];
    @Input() color = 'white';
}

@Component({
    selector: 'BillboardPlane',
    standalone: true,
    template: `
        <ngt-mesh>
            <ngt-plane-geometry *args="args" />
            <ngt-value attach="material.color" [rawValue]="color" />
            <ng-content />
        </ngt-mesh>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Plane {
    @Input() args: ConstructorParameters<typeof PlaneGeometry> = [];
    @Input() color = 'white';
}

@Component({
    standalone: true,
    template: `
        <ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[0.5, 2.05, 0.5]">
            <ngts-text text="box" [fontSize]="1" [outlineWidth]="'5%'" [outlineColor]="'#000'" [outlineOpacity]="1" />
        </ngts-billboard>
        <BillboardBox [position]="[0.5, 1, 0.5]" color="red">
            <ngt-mesh-standard-material />
        </BillboardBox>
        <ngt-group #group name="parent-group" [position]="[-2.5, -3, -1]">
            <ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[0, 1.05, 0]">
                <ngts-text
                    text="cone"
                    [fontSize]="1"
                    [outlineWidth]="'5%'"
                    [outlineColor]="'#000'"
                    [outlineOpacity]="1"
                />
            </ngts-billboard>
            <BillboardCone color="green">
                <ngt-mesh-standard-material />
            </BillboardCone>
        </ngt-group>
        <ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[0, 0, -5]">
            <BillboardPlane [args]="[2, 2]" color="#000066">
                <ngt-mesh-standard-material />
            </BillboardPlane>
        </ngts-billboard>

        <ngts-orbit-controls [enablePan]="true" [zoomSpeed]="0.5" />
    `,
    imports: [NgtsBillboard, NgtsOrbitControls, NgtsText, Cone, Box, Plane],
    schemas: [NO_ERRORS_SCHEMA],
})
class TextBillboardStory {
    @Input() follow = true;
    @Input() lockX = false;
    @Input() lockY = false;
    @Input() lockZ = false;
}

@Component({
    standalone: true,
    template: `
        <ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[-4, -2, 0]">
            <BillboardPlane [args]="[3, 2]" color="red" />
        </ngts-billboard>
        <ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[-4, 2, 0]">
            <BillboardPlane [args]="[3, 2]" color="orange" />
        </ngts-billboard>
        <ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[0, 0, 0]">
            <BillboardPlane [args]="[3, 2]" color="green" />
        </ngts-billboard>
        <ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[4, -2, 0]">
            <BillboardPlane [args]="[3, 2]" color="blue" />
        </ngts-billboard>
        <ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[4, 2, 0]">
            <BillboardPlane [args]="[3, 2]" color="yellow" />
        </ngts-billboard>

        <ngts-orbit-controls [enablePan]="true" [zoomSpeed]="0.5" />
    `,
    imports: [NgtsBillboard, Plane, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultBillboardStory {
    @Input() follow = true;
    @Input() lockX = false;
    @Input() lockY = false;
    @Input() lockZ = false;
}

export default {
    title: 'Abstractions/Billboard',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

const compoundPrefixes = ['BillboardBox'];

export const Default: StoryObj = {
    render: (args) => ({
        props: {
            options: makeCanvasOptions({ camera: { position: [0, 0, 10] }, controls: false, compoundPrefixes }),
            story: DefaultBillboardStory,
            inputs: args,
        },
        template: `
    <storybook-setup  [story]="story" [inputs]="inputs" [options]="options" />
        `,
    }),
    args: { follow: true, lockX: false, lockY: false, lockZ: false },
};

export const Text: StoryObj = {
    render: (args) => ({
        props: {
            options: makeCanvasOptions({ camera: { position: [0, 0, 10] }, controls: false, compoundPrefixes }),
            story: TextBillboardStory,
            inputs: args,
        },
        template: `
    <storybook-setup  [story]="story" [inputs]="inputs" [options]="options" />
        `,
    }),
    args: { follow: true, lockX: false, lockY: false, lockZ: false },
};
