import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { createRunInContext, extend, injectBeforeRender, injectNgtRef, NgtPush } from 'angular-three';
import { combineLatest, map } from 'rxjs';
import * as THREE from 'three';
import { Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { FullScreenQuad } from 'three-stdlib';
import { injectShadowMeshCommon } from './common';
import { NgtsSpotLightShadowMeshInput } from './shadow-mesh-input';
import { NGTS_SPOT_LIGHT_API } from './spot-light';

extend({ Mesh, PlaneGeometry, MeshBasicMaterial });

@Component({
    selector: 'ngts-spot-light-shadow-shader',
    standalone: true,
    template: `
        <ngt-mesh [ref]="mesh" [scale]="get('scale')" [castShadow]="true">
            <ngt-plane-geometry />
            <ngt-mesh-basic-material
                [transparent]="true"
                [side]="DoubleSide"
                [alphaTest]="get('alphaTest')"
                [alphaMap]="texture$ | ngtPush"
                [opacity]="spotLightApi.debug ? 1 : 0"
            >
                <ngt-value [rawValue]="RepeatWrapping" attach="alphaMap.wrapS" />
                <ngt-value [rawValue]="RepeatWrapping" attach="alphaMap.wrapT" />
                <ng-content />
            </ngt-mesh-basic-material>
        </ngt-mesh>
    `,
    imports: [NgtPush],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSpotLightShadowShader extends NgtsSpotLightShadowMeshInput implements OnInit {
    readonly mesh = injectNgtRef<THREE.Mesh>();
    readonly spotLightApi = inject(NGTS_SPOT_LIGHT_API);

    readonly DoubleSide = THREE.DoubleSide;
    readonly RepeatWrapping = THREE.RepeatWrapping;

    readonly runInContext = createRunInContext();

    readonly texture$ = this.select('renderTarget', 'texture');

    override initialize(): void {
        super.initialize();
        this.set({ distance: 0.4, alphaTest: 0.5, width: 512, height: 512, scale: 1 });
    }

    readonly uniforms = {
        uShadowMap: { value: this.get('map') },
        uTime: { value: 0 },
    };

    constructor() {
        super();
        this.connect(
            'renderTarget',
            combineLatest([this.select('width'), this.select('height')]).pipe(
                map(([width, height]) => {
                    return new THREE.WebGLRenderTarget(width, height, {
                        format: THREE.RGBAFormat,
                        encoding: THREE.LinearEncoding,
                        stencilBuffer: false,
                        // depthTexture: null!
                    });
                })
            )
        );

        this.connect(
            'fsQuad',
            this.select('shader').pipe(
                map((shader) => {
                    return new FullScreenQuad(
                        new THREE.ShaderMaterial({
                            uniforms: this.uniforms,
                            vertexShader: /* glsl */ `
                              varying vec2 vUv;

                              void main() {
                                vUv = uv;
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                              }
                            `,
                            fragmentShader: shader,
                        })
                    );
                })
            )
        );

        this.hold(this.select('map'), (map) => {
            this.uniforms.uShadowMap.value = map;
        });

        this.effect(this.select('fsQuad'), (fsQuad) => {
            return () => {
                fsQuad.dispose();
                fsQuad.material.dispose();
            };
        });
        this.effect(this.select('renderTarget'), (renderTarget) => {
            return () => {
                renderTarget.dispose();
            };
        });

        injectBeforeRender(({ delta, gl }) => {
            this.uniforms.uTime.value += delta;

            const { fsQuad, renderTarget } = this.get();
            if (fsQuad && renderTarget) {
                gl.setRenderTarget(renderTarget);
                fsQuad.render(gl);
                gl.setRenderTarget(null);
            }
        });
    }

    ngOnInit() {
        const commonEffect = this.runInContext(() => {
            return injectShadowMeshCommon(
                this.spotLightApi.spotLight,
                this.mesh,
                this.get('width'),
                this.get('height'),
                this.get('distance')
            );
        });
        commonEffect(this);
    }
}
