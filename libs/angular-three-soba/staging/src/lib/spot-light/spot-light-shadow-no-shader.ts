import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { createRunInContext, extend, injectNgtRef } from 'angular-three';
import * as THREE from 'three';
import { Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { injectShadowMeshCommon } from './common';
import { NgtsSpotLightShadowMeshInput } from './shadow-mesh-input';
import { NGTS_SPOT_LIGHT_API } from './spot-light';

extend({ Mesh, PlaneGeometry, MeshBasicMaterial });

@Component({
    selector: 'ngts-spot-light-shadow-no-shader',
    standalone: true,
    template: `
        <ngt-mesh [ref]="mesh" [scale]="get('scale')" [castShadow]="true">
            <ngt-plane-geometry />
            <ngt-mesh-basic-material
                *ngIf="!!get('map')"
                [transparent]="true"
                [side]="DoubleSide"
                [alphaTest]="get('alphaTest')"
                [alphaMap]="get('map')"
                [opacity]="spotLightApi.debug ? 1 : 0"
            >
                <ngt-value [rawValue]="RepeatWrapping" attach="alphaMap.wrapS" />
                <ngt-value [rawValue]="RepeatWrapping" attach="alphaMap.wrapT" />
                <ng-content />
            </ngt-mesh-basic-material>
        </ngt-mesh>
    `,
    imports: [NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSpotLightShadowNoShader extends NgtsSpotLightShadowMeshInput implements OnInit {
    readonly mesh = injectNgtRef<THREE.Mesh>();
    readonly spotLightApi = inject(NGTS_SPOT_LIGHT_API);

    readonly DoubleSide = THREE.DoubleSide;
    readonly RepeatWrapping = THREE.RepeatWrapping;

    readonly runInContext = createRunInContext();

    override initialize(): void {
        super.initialize();
        this.set({ distance: 0.4, alphaTest: 0.5, width: 512, height: 512 });
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
