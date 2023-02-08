import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, inject, InjectionToken, Input } from '@angular/core';
import { extend, injectNgtRef, NgtArgs, NgtRef, NgtRepeat, NgtRxStore } from 'angular-three';
import { combineLatest } from 'rxjs';
import * as THREE from 'three';
import { DirectionalLight, Group, OrthographicCamera, Vector2 } from 'three';
import { NgtsAccumulativeShadowsLightApi, NGTS_ACCUMULATIVE_SHADOWS_API } from './accumulative-shadows';

extend({ Group, DirectionalLight, OrthographicCamera, Vector2 });

export const NGTS_RANDOMIZED_LIGHTS_API = new InjectionToken<NgtsAccumulativeShadowsLightApi>(
    'NgtsRandomizedLights API'
);

function randomizedLightsApiFactory(randomizedLights: NgtsRandomizedLights) {
    const accumulativeApi = inject(NGTS_ACCUMULATIVE_SHADOWS_API);

    const update = () => {
        let light: THREE.DirectionalLight | undefined;
        if (randomizedLights.lightsRef.nativeElement) {
            for (let l = 0; l < randomizedLights.lightsRef.nativeElement.children.length; l++) {
                light = randomizedLights.lightsRef.nativeElement.children[l] as THREE.DirectionalLight;
                if (Math.random() > randomizedLights.get('ambient')) {
                    const position = randomizedLights.get('position');
                    const radius = randomizedLights.get('radius');
                    light.position.set(
                        position[0] + THREE.MathUtils.randFloatSpread(radius),
                        position[1] + THREE.MathUtils.randFloatSpread(radius),
                        position[2] + THREE.MathUtils.randFloatSpread(radius)
                    );
                } else {
                    const lambda = Math.acos(2 * Math.random() - 1) - Math.PI / 2.0;
                    const phi = 2 * Math.PI * Math.random();
                    const length = randomizedLights.get('length');
                    light.position.set(
                        Math.cos(lambda) * Math.cos(phi) * length,
                        Math.abs(Math.cos(lambda) * Math.sin(phi) * length),
                        Math.sin(lambda) * length
                    );
                }
            }
        }
    };

    const api = { update } as NgtsAccumulativeShadowsLightApi;

    randomizedLights.effect(
        combineLatest([
            randomizedLights.lightsRef.$,
            randomizedLights.select('position'),
            randomizedLights.select('radius'),
            randomizedLights.select('length'),
            randomizedLights.select('ambient'),
        ]),
        ([group]) => {
            if (accumulativeApi) accumulativeApi.lights.set(group.uuid, api);
            return () => accumulativeApi.lights.delete(group.uuid);
        }
    );

    return api;
}

@Directive({ selector: 'ngts-randomized-lights-consumer', standalone: true })
export class RandomizedLightsConsumer {
    constructor() {
        inject(NGTS_RANDOMIZED_LIGHTS_API);
    }
}

@Component({
    selector: 'ngts-randomized-lights',
    standalone: true,
    template: `
        <ngt-group ngtCompound *ref="lightsRef">
            <ngt-directional-light
                *ngFor="let i; repeat: get('amount')"
                [castShadow]="get('castShadow')"
                [intensity]="get('intensity') / get('amount')"
            >
                <ngt-value [rawValue]="get('bias')" attach="shadow.bias" />
                <ngt-vector2 *args="[get('mapSize'), get('mapSize')]" attach="shadow.mapSize" />
                <ngt-orthographic-camera *args="get('cameraArgs')" attach="shadow.camera" />
            </ngt-directional-light>
            <ngts-randomized-lights-consumer />
        </ngt-group>
    `,
    imports: [RandomizedLightsConsumer, NgtArgs, NgtRepeat, NgtRef],
    providers: [
        { provide: NGTS_RANDOMIZED_LIGHTS_API, useFactory: randomizedLightsApiFactory, deps: [NgtsRandomizedLights] },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsRandomizedLights extends NgtRxStore {
    @Input() lightsRef = injectNgtRef<THREE.Group>();
    /** How many frames it will jiggle the lights, 1.
     *  Frames is context aware, if a provider like AccumulativeShadows exists, frames will be taken from there!  */
    @Input() set frames(frames: number) {
        this.set({ frames });
    }

    /** Light position, [0, 0, 0] */
    @Input() set position(position: [x: number, y: number, z: number]) {
        this.set({ position });
    }

    /** Radius of the jiggle, higher values make softer light, 5 */
    @Input() set radius(radius: number) {
        this.set({ radius });
    }

    /** Amount of lights, 8 */
    @Input() set amount(amount: number) {
        this.set({ amount });
    }

    /** Light intensity, 1 */
    @Input() set intensity(intensity: number) {
        this.set({ intensity });
    }

    /** Ambient occlusion, lower values mean less AO, hight more, you can mix AO and directional light, 0.5 */
    @Input() set ambient(ambient: number) {
        this.set({ ambient });
    }

    /** If the lights cast shadows, this is true by default */
    @Input() set castShadow(castShadow: boolean) {
        this.set({ castShadow });
    }

    /** Default shadow bias, 0 */
    @Input() set bias(bias: number) {
        this.set({ bias });
    }

    /** Default map size, 512 */
    @Input() set mapSize(mapSize: number) {
        this.set({ mapSize });
    }

    /** Default size of the shadow camera, 10 */
    @Input() set size(size: number) {
        this.set({ size });
    }

    /** Default shadow camera near, 0.5 */
    @Input() set near(near: number) {
        this.set({ near });
    }

    /** Default shadow camera far, 500 */
    @Input() set far(far: number) {
        this.set({ far });
    }

    override initialize(): void {
        super.initialize();
        this.set({
            castShadow: true,
            bias: 0.001,
            mapSize: 512,
            size: 5,
            near: 0.5,
            far: 500,
            frames: 1,
            position: [0, 0, 0],
            radius: 1,
            amount: 8,
            intensity: 1,
            ambient: 0.5,
        });
        this.connect(
            'cameraArgs',
            this.select(['size', 'near', 'far'], ({ size, near, far }) => [-size, size, size, -size, near, far])
        );
        this.connect(
            'length',
            this.select(['position'], ({ position }) => new THREE.Vector3(...position).length())
        );
    }
}
