import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { extend, injectNgtRef, NgtPush } from 'angular-three';
import { MeshRefractionMaterial } from 'angular-three-soba/shaders';

extend({ MeshRefractionMaterial });

@Component({
    selector: 'ngts-mesh-refraction-material',
    standalone: true,
    template: `
        <ngt-mesh-refraction-material>
            <ng-content />
        </ngt-mesh-refraction-material>
    `,
    imports: [NgtPush, NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshRefractionMaterial {
    @Input() materialRef = injectNgtRef<typeof MeshRefractionMaterial>();
}
