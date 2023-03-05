import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import {
    extend,
    getLocalState,
    injectBeforeRender,
    injectNgtRef,
    NgtAnyRecord,
    NgtArgs,
    NgtRxStore,
} from 'angular-three';
import { injectNgtsFBO } from 'angular-three-soba/misc';
import { DiscardMaterial, MeshTransmissionMaterial } from 'angular-three-soba/shaders';
import { combineLatest, map } from 'rxjs';
import * as THREE from 'three';

extend({ MeshTransmissionMaterial });

@Component({
    selector: 'ngts-mesh-transmission-material',
    standalone: true,
    template: `
        <ngt-mesh-transmission-material
            *args="[get('samples'), get('transmissionSampler')]"
            ngtCompound
            [ref]="materialRef"
            [buffer]="get('buffer') || fboMainRef.nativeElement?.texture"
            [_transmission]="get('transmission')"
            [transmission]="get('transmissionSampler') ? get('transmission') : 0"
            [thickness]="get('thickness')"
            [side]="get('side')"
            [anisotropy]="get('anisotropy')"
            [roughness]="get('roughness')"
            [chromaticAberration]="get('chromaticAberration')"
            [distortion]="get('distortion')"
            [distortionScale]="get('distortionScale')"
            [temporalDistortion]="get('temporalDistortion')"
            [time]="get('time')"
        />
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshTranmissionMaterial extends NgtRxStore {
    @Input() materialRef = injectNgtRef<
        MeshTransmissionMaterial & {
            time: number;
            buffer?: THREE.Texture;
        }
    >();
    /** transmissionSampler, you can use the threejs transmission sampler texture that is
     *  generated once for all transmissive materials. The upside is that it can be faster if you
     *  use multiple MeshPhysical and Transmission materials, the downside is that transmissive materials
     *  using this can't see other transparent or transmissive objects, default: false */
    @Input() set transmissionSampler(transmissionSampler: boolean) {
        this.set({ transmissionSampler });
    }
    /** Render the backside of the material (more cost, better results), default: false */
    @Input() set backside(backside: boolean) {
        this.set({ backside });
    }
    /** Backside thickness (when backside is true), default: 0 */
    @Input() set backsideThickness(backsideThickness: number) {
        this.set({ backsideThickness });
    }
    /** Resolution of the local buffer, default: undefined (fullscreen) */
    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }
    /** Resolution of the local buffer for backfaces, default: undefined (fullscreen) */
    @Input() set backsideResolution(backsideResolution: number) {
        this.set({ backsideResolution });
    }
    /** Refraction samples, default: 10 */
    @Input() set samples(samples: number) {
        this.set({ samples });
    }
    /** Buffer scene background (can be a texture, a cubetexture or a color), default: null */
    @Input() set background(background: THREE.Texture | THREE.Color) {
        this.set({ background });
    }
    /* Transmission, default: 1 */
    @Input() set transmission(transmission: number) {
        this.set({ transmission });
    }
    /* Thickness (refraction), default: 0 */
    @Input() set thickness(thickness: number) {
        this.set({ thickness });
    }
    /* Roughness (blur), default: 0 */
    @Input() set roughness(roughness: number) {
        this.set({ roughness });
    }
    /* Chromatic aberration, default: 0.03 */
    @Input() set chromaticAberration(chromaticAberration: number) {
        this.set({ chromaticAberration });
    }
    /* Anisotropy, default: 0.1 */
    @Input() set anisotropy(anisotropy: number) {
        this.set({ anisotropy });
    }
    /* Distortion, default: 0 */
    @Input() set distortion(distortion: number) {
        this.set({ distortion });
    }
    /* Distortion scale, default: 0.5 */
    @Input() set distortionScale(distortionScale: number) {
        this.set({ distortionScale });
    }
    /* Temporal distortion (speed of movement), default: 0.0 */
    @Input() set temporalDistortion(temporalDistortion: number) {
        this.set({ temporalDistortion });
    }
    /** The scene rendered into a texture (use it to share a texture between materials), default: null  */
    @Input() set buffer(buffer: THREE.Texture) {
        this.set({ buffer });
    }
    /** Internals */
    @Input() set time(time: number) {
        this.set({ time });
    }

    readonly discardMaterial = new DiscardMaterial();
    readonly fboBackRef = injectNgtsFBO(() =>
        combineLatest([this.select('backsideResolution'), this.select('resolution')]).pipe(
            map(([backsideResolution, resolution]) => backsideResolution || resolution)
        )
    );
    readonly fboMainRef = injectNgtsFBO(() => this.select('resolution'));

    override initialize(): void {
        super.initialize();
        this.set({
            transmissionSampler: false,
            backside: false,
            side: THREE.FrontSide,
            transmission: 1,
            thickness: 0,
            backsideThickness: 0,
            samples: 10,
            roughness: 0,
            anisotropy: 0.1,
            chromaticAberration: 0.03,
            distortion: 0,
            distortionScale: 0.5,
            temporalDistortion: 0.0,
            buffer: null,
        });
    }

    constructor() {
        super();
        let oldBg: THREE.Scene['background'];
        let oldTone: THREE.WebGLRenderer['toneMapping'];
        let parent: THREE.Object3D;

        injectBeforeRender((state) => {
            const { transmissionSampler, background, backside, backsideThickness, thickness, side } = this.get();

            this.materialRef.nativeElement.time = state.clock.getElapsedTime();
            // Render only if the buffer matches the built-in and no transmission sampler is set
            if (
                this.materialRef.nativeElement.buffer === this.fboMainRef.nativeElement.texture &&
                !transmissionSampler
            ) {
                parent = getLocalState(this.materialRef.nativeElement).parent as THREE.Object3D;
                if (parent) {
                    // Save defaults
                    oldTone = state.gl.toneMapping;
                    oldBg = state.scene.background;

                    // Switch off tonemapping lest it double tone maps
                    // Save the current background and set the HDR as the new BG
                    // Use discardmaterial, the parent will be invisible, but it's shadows will still be cast
                    state.gl.toneMapping = THREE.NoToneMapping;
                    if (background) state.scene.background = background;
                    (parent as NgtAnyRecord)['material'] = this.discardMaterial;

                    if (backside) {
                        // Render into the backside buffer
                        state.gl.setRenderTarget(this.fboBackRef.nativeElement);
                        state.gl.render(state.scene, state.camera);
                        // And now prepare the material for the main render using the backside buffer
                        (parent as NgtAnyRecord)['material'] = this.materialRef.nativeElement;
                        (parent as NgtAnyRecord)['material'].buffer = this.fboBackRef.nativeElement.texture;
                        (parent as NgtAnyRecord)['material'].thickness = backsideThickness;
                        (parent as NgtAnyRecord)['material'].side = THREE.BackSide;
                    }

                    // Render into the main buffer
                    state.gl.setRenderTarget(this.fboMainRef.nativeElement);
                    state.gl.render(state.scene, state.camera);

                    (parent as NgtAnyRecord)['material'].thickness = thickness;
                    (parent as NgtAnyRecord)['material'].side = side;
                    (parent as NgtAnyRecord)['material'].buffer = this.fboMainRef.nativeElement.texture;

                    // Set old state back
                    state.scene.background = oldBg;
                    state.gl.setRenderTarget(null);
                    (parent as NgtAnyRecord)['material'] = this.materialRef.nativeElement;
                    state.gl.toneMapping = oldTone;
                }
            }
        });
    }

    ngOnInit() {
        console.log(this.materialRef);
    }
}
