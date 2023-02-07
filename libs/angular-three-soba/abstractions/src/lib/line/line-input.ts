import { Directive, Input } from '@angular/core';
import { NgtRxStore } from 'angular-three';

@Directive()
export abstract class NgtsLineInput extends NgtRxStore {
    @Input() set vertexColors(vertexColors: Array<THREE.Color | [number, number, number]>) {
        this.set({ vertexColors });
    }

    @Input() set lineWidth(lineWidth: number) {
        this.set({ lineWidth });
    }

    @Input() set alphaToCoverage(alphaToCoverage: boolean) {
        this.set({ alphaToCoverage });
    }

    @Input() set color(color: THREE.ColorRepresentation) {
        this.set({ color });
    }

    @Input() set dashed(dashed: boolean) {
        this.set({ dashed });
    }

    @Input() set dashScale(dashScale: number) {
        this.set({ dashScale });
    }

    @Input() set dashSize(dashSize: number) {
        this.set({ dashSize });
    }

    @Input() set dashOffset(dashOffset: number) {
        this.set({ dashOffset });
    }

    @Input() set gapSize(gapSize: number) {
        this.set({ gapSize });
    }

    @Input() set resolution(resolution: THREE.Vector2) {
        this.set({ resolution });
    }

    @Input() set wireframe(wireframe: boolean) {
        this.set({ wireframe });
    }

    @Input() set worldUnits(worldUnits: boolean) {
        this.set({ worldUnits });
    }

    override initialize(): void {
        super.initialize();
        this.set({ color: 'black' });
    }
}
