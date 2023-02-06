import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { extend, NgtArgs, NgtBeforeRenderEvent } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsCameraShake } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { BoxGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from 'three';
import { makeCanvasOptions, StorybookSetup } from '../setup-canvas';

extend({ Mesh, BoxGeometry, MeshStandardMaterial, PlaneGeometry, MeshBasicMaterial });

@Component({
    selector: 'CameraShakeScene',
    standalone: true,
    template: `
        <ngt-mesh (beforeRender)="onBeforeRender($any($event))">
            <ngt-box-geometry *args="[2, 2, 2]" />
            <ngt-mesh-standard-material [wireframe]="true" />
        </ngt-mesh>
        <ngt-mesh [position]="[0, -6, 0]" [rotation]="[Math.PI / -2, 0, 0]">
            <ngt-plane-geometry *args="[200, 200, 75, 75]" />
            <ngt-mesh-basic-material [wireframe]="true" color="red" [side]="DoubleSide" />
        </ngt-mesh>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Scene {
    readonly Math = Math;
    readonly DoubleSide = THREE.DoubleSide;

    onBeforeRender({ object: mesh }: NgtBeforeRenderEvent<THREE.Mesh>) {
        mesh.rotation.x = mesh.rotation.y += 0.01;
    }
}

@Component({
    standalone: true,
    template: `
        <ngts-orbit-controls [makeDefault]="true" />
        <ngts-camera-shake
            [maxPitch]="maxPitch"
            [maxRoll]="maxRoll"
            [maxYaw]="maxYaw"
            [pitchFrequency]="pitchFrequency"
            [rollFrequency]="rollFrequency"
            [yawFrequency]="yawFrequency"
        />
        <CameraShakeScene />
    `,
    imports: [NgtsCameraShake, Scene, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class WithOrbitControlsStory {
    @Input() maxPitch = 0.05;
    @Input() maxRoll = 0.05;
    @Input() maxYaw = 0.05;
    @Input() pitchFrequency = 0.8;
    @Input() rollFrequency = 0.8;
    @Input() yawFrequency = 0.8;
}

@Component({
    standalone: true,
    template: `
        <ngts-camera-shake
            [maxPitch]="maxPitch"
            [maxRoll]="maxRoll"
            [maxYaw]="maxYaw"
            [pitchFrequency]="pitchFrequency"
            [rollFrequency]="rollFrequency"
            [yawFrequency]="yawFrequency"
        />
        <CameraShakeScene />
    `,
    imports: [NgtsCameraShake, Scene],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultCameraShakeStory {
    @Input() maxPitch = 0.05;
    @Input() maxRoll = 0.05;
    @Input() maxYaw = 0.05;
    @Input() pitchFrequency = 0.8;
    @Input() rollFrequency = 0.8;
    @Input() yawFrequency = 0.8;
}

export default {
    title: 'Staging/Camera Shake',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default: Story = (args) => ({
    props: {
        inputs: args,
        story: DefaultCameraShakeStory,
        options: makeCanvasOptions({ camera: { position: [0, 0, 10] }, controls: false }),
    },
    template: `
<storybook-setup [options]="options" [story]="story" [inputs]="inputs">
  `,
});

Default.args = {
    maxPitch: 0.05,
    maxRoll: 0.05,
    maxYaw: 0.05,
    pitchFrequency: 0.8,
    rollFrequency: 0.8,
    yawFrequency: 0.8,
};

export const WithOrbitControls: Story = (args) => ({
    props: {
        inputs: args,
        story: WithOrbitControlsStory,
        options: makeCanvasOptions({ camera: { position: [0, 0, 10] }, controls: false }),
    },
    template: `
<storybook-setup [options]="options" [story]="story" [inputs]="inputs">
  `,
});

WithOrbitControls.args = {
    maxPitch: 0.05,
    maxRoll: 0.05,
    maxYaw: 0.05,
    pitchFrequency: 0.8,
    rollFrequency: 0.8,
    yawFrequency: 0.8,
};
