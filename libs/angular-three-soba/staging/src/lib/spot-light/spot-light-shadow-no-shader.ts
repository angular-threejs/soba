import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { checkUpdate, createRunInContext, extend, injectNgtRef, NgtPush } from 'angular-three';
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
                [transparent]="true"
                [side]="DoubleSide"
                [alphaTest]="get('alphaTest')"
                [alphaMap]="map$ | ngtPush"
                [opacity]="spotLightApi.debug ? 1 : 0"
            >
                <ng-content />
            </ngt-mesh-basic-material>
        </ngt-mesh>
    `,
    imports: [NgtPush],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSpotLightShadowNoShader extends NgtsSpotLightShadowMeshInput implements OnInit {
    readonly mesh = injectNgtRef<THREE.Mesh>();
    readonly spotLightApi = inject(NGTS_SPOT_LIGHT_API);

    readonly DoubleSide = THREE.DoubleSide;

    readonly runInContext = createRunInContext();

    override initialize(): void {
        super.initialize();
        this.set({ distance: 0.4, alphaTest: 0.5, width: 512, height: 512 });
        this.hold(this.select('map'), (map) => {
            if (map) {
                map.wrapS = map.wrapT = THREE.RepeatWrapping;
                checkUpdate(map);
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
