import { Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { applyProps, extend, NgtArgs, NgtPush, NgtRxStore } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { NgtsAccumulativeShadows, NgtsEnvironment, NgtsRandomizedLights } from 'angular-three-soba/staging';
import { map, Observable } from 'rxjs';
import * as THREE from 'three';
import { Color } from 'three';
import { GLTF } from 'three-stdlib';
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture';
import { makeCanvasOptions, StorybookSetup } from '../setup-canvas';

extend({ Color });

interface SuziGLTF extends GLTF {
    materials: { default: THREE.MeshStandardMaterial };
}

@Component({
    selector: 'Suzi',
    standalone: true,
    template: `
        <ngt-primitive ngtCompound *args="[model$ | ngtPush]" />
    `,
    imports: [NgtArgs, NgtPush],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Suzi extends NgtRxStore implements OnInit {
    private readonly suzi$ = injectNgtsGLTFLoader(
        'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/suzanne-high-poly/model.gltf'
    ) as unknown as Observable<SuziGLTF>;
    readonly model$ = this.suzi$.pipe(map((gltf) => gltf.scene));

    ngOnInit() {
        this.hold(this.suzi$, ({ scene, materials }) => {
            scene.traverse((obj: any) => obj.isMesh && (obj.receiveShadow = obj.castShadow = true));
            applyProps(materials.default, {
                color: 'orange',
                roughness: 0,
                normalMap: new THREE.CanvasTexture(
                    new FlakesTexture(),
                    THREE.UVMapping,
                    THREE.RepeatWrapping,
                    THREE.RepeatWrapping
                ),
                normalScale: [0.05, 0.05],
            });
            applyProps(materials.default.normalMap, {
                flipY: false,
                repeat: [40, 40],
            });
        });
    }
}

@Component({
    standalone: true,
    template: `
        <ngt-color *args="['chocolate']" attach="background" />

        <Suzi [rotation]="[-0.63, 0, 0]" [scale]="2" [position]="[0, -1.175, 0]" />
        <ngts-accumulative-shadows
            color="goldenrod"
            [temporal]="true"
            [frames]="100"
            [alphaTest]="0.65"
            [opacity]="2"
            [scale]="14"
            [position]="[0, -0.5, 0]"
        >
            <ngts-randomized-lights [amount]="8" [radius]="4" [ambient]="0.5" [bias]="0.001" [position]="[5, 5, -10]" />
        </ngts-accumulative-shadows>
        <ngts-orbit-controls [autoRotate]="true" />
        <ngts-environment preset="city" />
    `,
    imports: [NgtsAccumulativeShadows, NgtsRandomizedLights, NgtsOrbitControls, NgtsEnvironment, NgtArgs, Suzi],
    schemas: [NO_ERRORS_SCHEMA],
})
class DefaultAccumulativeShadowsStory {}

export default {
    title: 'Staging/Accumulative Shadows',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default: Story = () => ({
    props: {
        story: DefaultAccumulativeShadowsStory,
        options: makeCanvasOptions({ compoundPrefixes: ['Suzi'] }),
    },
    template: '<storybook-setup [story]="story" [options]="options" />',
});
