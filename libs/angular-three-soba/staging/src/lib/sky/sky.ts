import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { injectNgtRef, NgtArgs, NgtRxStore } from 'angular-three';
import { Vector3 } from 'three';
import { Sky } from 'three-stdlib';

export function calcPosFromAngles(inclination: number, azimuth: number, vector: Vector3 = new Vector3()) {
    const theta = Math.PI * (inclination - 0.5);
    const phi = 2 * Math.PI * (azimuth - 0.5);

    vector.x = Math.cos(phi);
    vector.y = Math.sin(theta);
    vector.z = Math.sin(phi);

    return vector;
}

@Component({
    selector: 'ngts-sky',
    standalone: true,
    template: `
        <ngt-primitive ngtCompound *args="[sky]" [ref]="skyRef" [scale]="get('scale')">
            <ngt-value [rawValue]="get('mieCoefficient')" attach="material.uniforms.mieCoefficient.value" />
            <ngt-value [rawValue]="get('mieDirectionalG')" attach="material.uniforms.mieDirectionalG.value" />
            <ngt-value [rawValue]="get('rayleigh')" attach="material.uniforms.rayleigh.value" />
            <ngt-value [rawValue]="get('sunPosition')" attach="material.uniforms.sunPosition.value" />
            <ngt-value [rawValue]="get('turbidity')" attach="material.uniforms.turbidity.value" />
        </ngt-primitive>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSky extends NgtRxStore {
    @Input() skyRef = injectNgtRef<Sky>();

    @Input() set distance(distance: number) {
        this.set({ distance });
    }

    @Input() set sunPosition(sunPosition: THREE.Vector3 | Parameters<THREE.Vector3['set']>) {
        this.set({ sunPosition });
    }

    @Input() set inclination(inclination: number) {
        this.set({ inclination });
    }

    @Input() set azimuth(azimuth: number) {
        this.set({ azimuth });
    }

    @Input() set mieCoefficient(mieCoefficient: number) {
        this.set({ mieCoefficient });
    }

    @Input() set mieDirectionalG(mieDirectionalG: number) {
        this.set({ mieDirectionalG });
    }

    @Input() set rayleigh(rayleigh: number) {
        this.set({ rayleigh });
    }

    @Input() set turbidity(turbidity: number) {
        this.set({ turbidity });
    }

    readonly sky = new Sky();

    override initialize(): void {
        super.initialize();
        const inclination = 0.6;
        const azimuth = 0.1;
        this.set({
            inclination,
            azimuth,
            distance: 1000,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.8,
            rayleigh: 0.5,
            turbidity: 10,
            sunPosition: calcPosFromAngles(inclination, azimuth),
        });
        this.connect(
            'sunPosition',
            this.select(['inclination', 'azimuth'], ({ inclination, azimuth }) =>
                calcPosFromAngles(inclination, azimuth)
            )
        );
        this.connect(
            'scale',
            this.select(['distance'], ({ distance }) => new Vector3().setScalar(distance))
        );
    }
}
