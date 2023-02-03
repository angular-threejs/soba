import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, NgtRenderState, NgtRxStore } from 'angular-three';
import * as THREE from 'three';
import { Group } from 'three';

extend({ Group });

@Component({
    selector: 'ngts-float',
    standalone: true,
    template: `
        <ngt-group ngtCompound>
            <ngt-group [ref]="floatRef">
                <ng-content />
            </ngt-group>
        </ngt-group>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsFloat extends NgtRxStore {
    private readonly offset = Math.random() * 10000;

    @Input() floatRef = injectNgtRef<THREE.Group>();

    @Input() set speed(speed: number) {
        this.set({ speed });
    }

    @Input() set rotationIntensity(rotationIntensity: number) {
        this.set({ rotationIntensity });
    }

    @Input() set floatIntensity(floatIntensity: number) {
        this.set({ floatIntensity });
    }

    @Input() set floatingRange(floatingRange: [number?, number?]) {
        this.set({ floatingRange });
    }

    override initialize(): void {
        super.initialize();
        this.set({ speed: 1, rotationIntensity: 1, floatIntensity: 1, floatingRange: [-0.1, 0.1] });
    }

    constructor() {
        super();
        injectBeforeRender(this.onBeforeRender.bind(this));
    }

    private onBeforeRender({ clock }: NgtRenderState) {
        if (!this.floatRef.nativeElement) return;
        const { speed, floatingRange, floatIntensity, rotationIntensity } = this.get();
        const t = this.offset + clock.getElapsedTime();
        this.floatRef.nativeElement.rotation.x = (Math.cos((t / 4) * speed) / 8) * rotationIntensity;
        this.floatRef.nativeElement.rotation.y = (Math.sin((t / 4) * speed) / 8) * rotationIntensity;
        this.floatRef.nativeElement.rotation.z = (Math.sin((t / 4) * speed) / 20) * rotationIntensity;
        let yPosition = Math.sin((t / 4) * speed) / 10;
        yPosition = THREE.MathUtils.mapLinear(yPosition, -0.1, 0.1, floatingRange[0] ?? -0.1, floatingRange[1] ?? 0.1);
        this.floatRef.nativeElement.position.y = yPosition * floatIntensity;
    }
}
