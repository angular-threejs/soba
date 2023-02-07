import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { Meta, moduleMetadata, StoryFn } from '@storybook/angular';
import { extend, NgtAnyRecord, NgtArgs, NgtPush, NgtThreeEvent } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { NgtsBounds, NgtsContactShadows, NGTS_BOUNDS_API } from 'angular-three-soba/staging';
import { map } from 'rxjs';
import { Color, Group, HemisphereLight, Mesh, SpotLight } from 'three';
import { makeCanvasOptions, StorybookSetup } from '../setup-canvas';

extend({ Mesh, Color, SpotLight, HemisphereLight, Group });

@Component({
    selector: 'Model[name]',
    standalone: true,
    template: `
        <ngt-mesh *ngIf="model$ | ngtPush as model" ngtCompound [material]="model.material" [geometry]="model.geometry">
            <ngt-value [rawValue]="'red'" attach="material.emissive" />
            <ngt-value [rawValue]="1" attach="material.roughness" />
        </ngt-mesh>
    `,
    imports: [NgtArgs, NgIf, NgtPush],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Model {
    private readonly models$ = injectNgtsGLTFLoader('soba/bounds-assets.glb');
    readonly model$ = this.models$.pipe(map(({ nodes }) => nodes[this.name] as Mesh));

    @Input() name = '';
}

@Component({
    selector: 'Models',
    standalone: true,
    template: `
        <ngt-group (click)="onClick($any($event))" (pointermissed)="onPointerMissed($any($event))">
            <Model name="Curly" [position]="[1, -11, -20]" [rotation]="[2, 0, -0]" />
            <Model name="DNA" [position]="[20, 0, -17]" [rotation]="[1, 1, -2]" />
            <Model name="Headphones" [position]="[20, 2, 4]" [rotation]="[1, 0, -1]" />
            <Model name="Notebook" [position]="[-21, -15, -13]" [rotation]="[2, 0, 1]" />
            <Model name="Rocket003" [position]="[18, 15, -25]" [rotation]="[1, 1, 0]" />
            <Model name="Roundcube001" [position]="[-25, -4, 5]" [rotation]="[1, 0, 0]" [scale]="0.5" />
            <Model name="Table" [position]="[1, -4, -28]" [rotation]="[1, 0, -1]" [scale]="0.5" />
            <Model name="VR_Headset" [position]="[7, -15, 28]" [rotation]="[1, 0, -1]" [scale]="5" />
            <Model name="Zeppelin" [position]="[-20, 10, 10]" [rotation]="[3, -1, 3]" [scale]="0.005" />
        </ngt-group>
    `,
    imports: [Model],
    schemas: [NO_ERRORS_SCHEMA],
})
class Models {
    private readonly boundsApi = inject(NGTS_BOUNDS_API);

    onClick(event: NgtThreeEvent<MouseEvent>) {
        event.stopPropagation();
        event.delta <= 2 && this.boundsApi.refresh(event.object).fit();
    }

    onPointerMissed(event: NgtThreeEvent<PointerEvent>) {
        (event as NgtAnyRecord)['button'] === 0 && this.boundsApi.refresh().fit();
    }
}

@Component({
    standalone: true,
    template: `
        <ngt-color *args="['orangered']" attach="background" />

        <ngt-spot-light [position]="-100" [intensity]="0.2" [angle]="0.3" [penumbra]="1" />
        <ngt-hemisphere-light color="white" groundColor="#ff0f00" [position]="[-7, 25, 13]" [intensity]="1" />

        <ngts-bounds>
            <Models />
        </ngts-bounds>

        <ngts-contact-shadows
            [position]="[0, -35, 0]"
            [opacity]="1"
            [width]="200"
            [height]="200"
            [blur]="1"
            [far]="50"
        />

        <ngts-orbit-controls [makeDefault]="true" [minPolarAngle]="0" [maxPolarAngle]="Math.PI * 1.75" />
    `,
    imports: [NgtsBounds, NgtArgs, NgtsOrbitControls, NgtsContactShadows, Models],
    schemas: [NO_ERRORS_SCHEMA],
})
class DefaultBoundsStory {
    readonly Math = Math;
}

export default {
    title: 'Staging/Bounds',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default: StoryFn = () => ({
    props: {
        options: makeCanvasOptions({
            camera: { fov: 50, position: [0, -10, 100] },
            controls: false,
            lights: false,
            compoundPrefixes: ['Model'],
        }),
        story: DefaultBoundsStory,
    },
    template: `
<storybook-setup [story]="story" [options]="options" />
    `,
});
