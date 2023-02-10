import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, NgtArgs, NgtRxStore } from 'angular-three';
import { MeshWobbleMaterial } from 'angular-three-soba/shaders';

extend({ MeshWobbleMaterial });

@Component({
    selector: 'ngts-mesh-wobble-material',
    standalone: true,
    template: `
        <ngt-primitive
            *args="[material]"
            [ref]="materialRef"
            [time]="get('time')"
            [factor]="get('factor')"
            attach="material"
            ngtCompound
        />
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshWobbleMaterial extends NgtRxStore {
    readonly material = new MeshWobbleMaterial();

    @Input() materialRef = injectNgtRef<MeshWobbleMaterial>();

    @Input() set time(time: number) {
        this.set({ time });
    }

    @Input() set factor(factor: number) {
        this.set({ factor });
    }

    @Input() set speed(speed: number) {
        this.set({ speed });
    }

    override initialize(): void {
        super.initialize();
        this.set({ speed: 1, time: 0, factor: 1 });
    }

    constructor() {
        super();
        injectBeforeRender(({ clock }) => {
            this.material.time = clock.getElapsedTime() * this.get('speed');
        });
    }
}
