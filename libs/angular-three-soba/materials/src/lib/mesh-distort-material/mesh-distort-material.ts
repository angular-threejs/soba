import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input } from '@angular/core';
import { injectBeforeRender, injectNgtRef, NgtArgs, NgtRxStore } from 'angular-three';
import { MeshDistortMaterial, NGTS_DISTORT_MATERIAL_SHADER } from 'angular-three-soba/shaders';

@Component({
    selector: 'ngts-mesh-distort-material',
    standalone: true,
    template: `
        <ngt-primitive
            *args="[material]"
            [ref]="materialRef"
            [time]="get('time')"
            [distort]="get('distort')"
            [radius]="get('radius')"
            ngtCompound
            attach="material"
        />
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshDistortMaterial extends NgtRxStore {
    readonly MeshDistortMaterial = inject(NGTS_DISTORT_MATERIAL_SHADER);

    readonly material = new this.MeshDistortMaterial();

    @Input() materialRef = injectNgtRef<InstanceType<MeshDistortMaterial>>();

    @Input() set time(time: number) {
        this.set({ time });
    }

    @Input() set distort(distort: number) {
        this.set({ distort });
    }

    @Input() set radius(radius: number) {
        this.set({ radius });
    }

    @Input() set speed(speed: number) {
        this.set({ speed });
    }

    override initialize(): void {
        super.initialize();
        this.set({ speed: 1, time: 0, distort: 0.4, radius: 1 });
    }

    constructor() {
        super();
        injectBeforeRender(({ clock }) => {
            this.material.time = clock.getElapsedTime() * this.get('speed');
        });
    }
}
