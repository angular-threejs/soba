import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, InjectionToken, Input } from '@angular/core';
import { extend, injectNgtRef, NgtArgs, NgtInjectedRef } from 'angular-three';
import { Group, SpotLight, SpotLightHelper } from 'three';
import { NgtsSpotLightInput } from './spot-light-input';
import { NgtsVolumetricMesh } from './volumetric-mesh';

extend({ SpotLight, SpotLightHelper, Group });

export interface NgtsSpotLightAPI {
    spotLight: NgtInjectedRef<THREE.SpotLight>;
    debug: boolean;
}

export const NGTS_SPOT_LIGHT_API = new InjectionToken<NgtsSpotLightAPI>('NgtsSpotLight API');

function spotLightApiFactory(spotLight: NgtsSpotLight): NgtsSpotLightAPI {
    const api = {
        spotLight: spotLight.spotLightRef,
    };

    Object.defineProperty(api, 'debug', {
        get: () => spotLight.get('debug'),
    });

    return api as NgtsSpotLightAPI;
}

@Component({
    selector: 'ngts-spot-light',
    standalone: true,
    template: `
        <ngt-group>
            <ng-container *ngIf="get('debug') && spotLightRef.nativeElement">
                <ngt-spot-light-helper *args="[spotLightRef.nativeElement]" />
            </ng-container>
            <ngt-spot-light
                [ref]="spotLightRef"
                [color]="get('color')"
                [distance]="get('distance')"
                [angle]="get('angle')"
                [castShadow]="true"
                ngtCompound
            >
                <ngts-volumetric-mesh
                    *ngIf="get('volumetric')"
                    [debug]="get('debug')"
                    [opacity]="get('opacity')"
                    [radiusTop]="get('radiusTop')"
                    [radiusBottom]="get('radiusBottom')"
                    [depthBuffer]="get('depthBuffer')"
                    [color]="get('color')"
                    [distance]="get('distance')"
                    [angle]="get('angle')"
                    [attenuation]="get('attenuation')"
                    [anglePower]="get('anglePower')"
                />
            </ngt-spot-light>
            <ng-content />
        </ngt-group>
    `,
    imports: [NgIf, NgtArgs, NgtsVolumetricMesh],
    providers: [{ provide: NGTS_SPOT_LIGHT_API, useFactory: spotLightApiFactory, deps: [NgtsSpotLight] }],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSpotLight extends NgtsSpotLightInput {
    @Input() spotLightRef = injectNgtRef<THREE.SpotLight>();

    @Input() set volumetric(volumetric: boolean) {
        this.set({ volumetric });
    }

    override initialize(): void {
        super.initialize();
        this.set({
            opacity: 1,
            color: 'white',
            distance: 5,
            angle: 0.15,
            attenuation: 5,
            anglePower: 5,
            volumetric: true,
            debug: false,
        });
    }
}
