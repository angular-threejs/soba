import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { NgtsSpotLightShadowMeshInput } from './shadow-mesh-input';
import { NgtsSpotLightShadowNoShader } from './spot-light-shadow-no-shader';
import { NgtsSpotLightShadowShader } from './spot-light-shadow-shader';

@Component({
    selector: 'ngts-spot-light-shadow',
    standalone: true,
    template: `
        <ngts-spot-light-shadow-shader
            *ngIf="get('shader'); else noShader"
            [distance]="get('distance')"
            [shader]="get('shader')"
            [alphaTest]="get('alphaTest')"
            [scale]="get('scale')"
            [map]="get('map')"
            [width]="get('width')"
            [height]="get('height')"
        />
        <ng-template #noShader>
            <ngts-spot-light-shadow-no-shader
                [distance]="get('distance')"
                [alphaTest]="get('alphaTest')"
                [scale]="get('scale')"
                [map]="get('map')"
                [width]="get('width')"
                [height]="get('height')"
            />
        </ng-template>
    `,
    imports: [NgtsSpotLightShadowShader, NgtsSpotLightShadowNoShader, NgIf],
})
export class NgtsSpotLightShadow extends NgtsSpotLightShadowMeshInput {}
