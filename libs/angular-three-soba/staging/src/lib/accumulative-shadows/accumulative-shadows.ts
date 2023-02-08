import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, inject, InjectionToken, Input } from '@angular/core';
import { extend, getLocalState, injectNgtRef, NgtRef, NgtRxStore, NgtStore } from 'angular-three';
import { shaderMaterial } from 'angular-three-soba/shaders';
import { combineLatest, Subject } from 'rxjs';
import * as THREE from 'three';
import { Group, Mesh, PlaneGeometry } from 'three';
import { ProgressiveLightMap } from './progressive-light-map';

const SoftShadowMaterial = shaderMaterial(
    {
        color: new THREE.Color(),
        blend: 2.0,
        alphaTest: 0.75,
        opacity: 0,
        map: null,
    },
    // language=GLSL
    `
varying vec2 vUv;
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
  vUv = uv;
}
  `,
    // language=GLSL
    `
varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float blend;
uniform float opacity;
uniform float alphaTest;
void main() {
  vec4 sampledDiffuseColor = texture2D(map, vUv);
  gl_FragColor = vec4(color * sampledDiffuseColor.r * blend, max(0.0, (1.0 - (sampledDiffuseColor.r + sampledDiffuseColor.g + sampledDiffuseColor.b) / alphaTest)) * opacity);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}
  `
);

type SoftShadowMaterialInputs = {
    map: THREE.Texture;
    color?: THREE.ColorRepresentation;
    alphaTest?: number;
    blend?: number;
};

extend({ SoftShadowMaterial, Group, Mesh, PlaneGeometry });

export type NgtsAccumulativeShadowsLightApi = { update: () => void };

export type NgtsAccumulativeShadowsApi = {
    lights: Map<string, NgtsAccumulativeShadowsLightApi>;
    temporal: boolean;
    frames: number;
    blend: number;
    count: number;
    getMesh: () => THREE.Mesh<THREE.PlaneGeometry, SoftShadowMaterialInputs & THREE.ShaderMaterial>;
    reset: () => void;
    update: (frames?: number) => void;
};

export const NGTS_ACCUMULATIVE_SHADOWS_API = new InjectionToken<NgtsAccumulativeShadowsApi>(
    'NgtsAccumulativeShadows API'
);

function accumulativeShadowsApiFactory(accumulativeShadows: NgtsAccumulativeShadows) {
    const store = inject(NgtStore);

    const api = {
        lights: new Map(),
        count: 0,
        getMesh: () =>
            accumulativeShadows.meshRef.nativeElement as THREE.Mesh<
                THREE.PlaneGeometry,
                SoftShadowMaterialInputs & THREE.ShaderMaterial
            >,
        reset: () => {
            accumulativeShadows.pLM.clear();
            const material = api.getMesh().material;
            material.opacity = 0;
            material.alphaTest = 0;
            api.count = 0;
        },
        update: (frames = 1) => {
            // adapt the opacity blend ratio to the number of frames
            const material = api.getMesh().material;
            if (!api.temporal) {
                material.opacity = accumulativeShadows.get('opacity');
                material.alphaTest = accumulativeShadows.get('alphaTest');
            } else {
                material.opacity = Math.min(
                    accumulativeShadows.get('opacity'),
                    material.opacity + accumulativeShadows.get('opacity') / api.blend
                );
                material.alphaTest = Math.min(
                    accumulativeShadows.get('alphaTest'),
                    material.alphaTest + accumulativeShadows.get('alphaTest') / api.blend
                );
            }

            // switch accumulative lights on
            accumulativeShadows.accumulativeShadowsRef.nativeElement.visible = true;
            // collect scene lights and meshes
            accumulativeShadows.pLM.prepare();

            // update the lightmap and the accumulative lights
            for (let i = 0; i < frames; i++) {
                api.lights.forEach((light) => light.update());
                accumulativeShadows.pLM.update(store.get('camera'), api.blend);
            }

            // switch lights off
            accumulativeShadows.accumulativeShadowsRef.nativeElement.visible = false;
            // restore lights and meshes
            accumulativeShadows.pLM.finish();
        },
    } as NgtsAccumulativeShadowsApi;

    Object.defineProperties(api, {
        temporal: {
            get: () => !!accumulativeShadows.get('temporal'),
        },
        frames: {
            get: () => Math.max(2, accumulativeShadows.get('frames')),
        },
        blend: {
            get: () =>
                Math.max(
                    2,
                    accumulativeShadows.get('frames') === Infinity
                        ? accumulativeShadows.get('blend')
                        : accumulativeShadows.get('frames')
                ),
        },
    });

    const subject = new Subject<void>();

    accumulativeShadows.hold(accumulativeShadows.meshRef.$, (mesh) => {
        accumulativeShadows.pLM.configure(mesh);

        accumulativeShadows.hold(
            combineLatest([accumulativeShadows.select(), getLocalState(store.get('scene')).objects]),
            () => {
                // reset internals, buffers, ...
                api.reset();
                // update lightmap
                if (!api.temporal && api.frames !== Infinity) api.update(api.blend);
            }
        );

        accumulativeShadows.effect(subject, () =>
            store.get('internal').subscribe(() => {
                const limit = accumulativeShadows.get('limit');
                if ((api.temporal || api.frames === Infinity) && api.count < api.frames && api.count < limit) {
                    api.update();
                    api.count++;
                }
            })
        );
        subject.next();
    });

    return api;
}

@Directive({ selector: 'ngts-accumulative-shadows-consumer', standalone: true })
export class AccumulativeShadowsConsumer {
    constructor() {
        inject(NGTS_ACCUMULATIVE_SHADOWS_API);
    }
}

@Component({
    selector: 'ngts-accumulative-shadows',
    standalone: true,
    template: `
        <ngt-group ngtCompound>
            <ngt-group *ref="accumulativeShadowsRef" [traverse]="nullTraverse">
                <ng-content />
                <ngts-accumulative-shadows-consumer />
            </ngt-group>
            <ngt-mesh *ref="meshRef" [receiveShadow]="true" [scale]="get('scale')" [rotation]="[-Math.PI / 2, 0, 0]">
                <ngt-plane-geometry />
                <ngt-soft-shadow-material
                    [transparent]="true"
                    [depthWrite]="false"
                    [color]="get('color')"
                    [toneMapped]="get('toneMapped')"
                    [blend]="get('colorBlend')"
                    [map]="pLM.progressiveLightMap2.texture"
                />
            </ngt-mesh>
        </ngt-group>
    `,
    imports: [AccumulativeShadowsConsumer, NgtRef],
    providers: [
        {
            provide: NGTS_ACCUMULATIVE_SHADOWS_API,
            useFactory: accumulativeShadowsApiFactory,
            deps: [NgtsAccumulativeShadows],
        },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsAccumulativeShadows extends NgtRxStore {
    readonly nullTraverse = () => null;
    readonly Math = Math;

    private readonly store = inject(NgtStore);

    readonly pLM = new ProgressiveLightMap(this.store.get('gl'), this.store.get('scene'), this.get('resolution'));

    readonly accumulativeShadowsRef = injectNgtRef<THREE.Group>();
    readonly meshRef = injectNgtRef<THREE.Mesh>();

    /** How many frames it can render, more yields cleaner results but takes more time, 40 */
    @Input() set frames(frames: number) {
        this.set({ frames });
    }

    /** If frames === Infinity blend controls the refresh ratio, 100 */
    @Input() set blend(blend: number) {
        this.set({ blend });
    }

    /** Can limit the amount of frames rendered if frames === Infinity, usually to get some performance back once a movable scene has settled, Infinity */
    @Input() set limit(limit: number) {
        this.set({ limit });
    }

    /** Scale of the plane,  */
    @Input() set scale(scale: number) {
        this.set({ scale });
    }

    /** Temporal accumulates shadows over time which is more performant but has a visual regression over instant results, false  */
    @Input() set temporal(temporal: boolean) {
        this.set({ temporal });
    }

    /** Opacity of the plane, 1 */
    @Input() set opacity(opacity: number) {
        this.set({ opacity });
    }

    /** Discards alpha pixels, 0.65 */
    @Input() set alphaTest(alphaTest: number) {
        this.set({ alphaTest });
    }

    /** Shadow color, black */
    @Input() set color(color: string) {
        this.set({ color });
    }

    /** Colorblend, how much colors turn to black, 0 is black, 2 */
    @Input() set colorBlend(colorBlend: number) {
        this.set({ colorBlend });
    }

    /** Buffer resolution, 1024 */
    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }

    /** Texture tonemapping */
    @Input() set toneMapped(toneMapped: boolean) {
        this.set({ toneMapped });
    }

    override initialize(): void {
        super.initialize();
        this.set({
            frames: 40,
            limit: Infinity,
            blend: 20,
            scale: 10,
            opacity: 1,
            alphaTest: 0.75,
            color: 'black',
            colorBlend: 2,
            resolution: 1024,
            toneMapped: true,
        });
    }
}
