import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { injectNgtRef } from 'angular-three';
import * as THREE from 'three';
import { Line2 } from 'three-stdlib';
import { NgtsLine } from '../line/line';
import { NgtsLineInput } from '../line/line-input';

@Component({
    selector: 'ngts-cubic-bezier-line[start][end][midA][midB]',
    standalone: true,
    template: `
        <ngts-line
            [lineRef]="lineRef"
            [points]="get('points')"
            [color]="get('color')"
            [vertexColors]="get('vertexColors')"
            [resolution]="get('resolution')"
            [lineWidth]="get('lineWidth')"
            [alphaToCoverage]="get('alphaToCoverage')"
            [dashed]="get('dashed')"
            [dashScale]="get('dashScale')"
            [dashSize]="get('dashSize')"
            [dashOffset]="get('dashOffset')"
            [gapSize]="get('gapSize')"
            [wireframe]="get('wireframe')"
            [worldUnits]="get('worldUnits')"
        />
    `,
    imports: [NgtsLine, NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCubicBezierLine extends NgtsLineInput {
    @Input() lineRef = injectNgtRef<Line2>();

    @Input() set start(start: THREE.Vector3 | [number, number, number]) {
        this.set({ start });
    }

    @Input() set end(end: THREE.Vector3 | [number, number, number]) {
        this.set({ end });
    }

    @Input() set midA(midA: THREE.Vector3 | [number, number, number]) {
        this.set({ midA });
    }

    @Input() set midB(midB: THREE.Vector3 | [number, number, number]) {
        this.set({ midB });
    }

    @Input() set segments(segments: number) {
        this.set({ segments });
    }

    override initialize(): void {
        super.initialize();
        this.set({ segments: 10 });
        this.connect(
            'points',
            this.select(['start', 'end', 'midA', 'midB', 'segments'], ({ start, end, midA, midB, segments }) => {
                const startV = start instanceof THREE.Vector3 ? start : new THREE.Vector3(...start);
                const endV = end instanceof THREE.Vector3 ? end : new THREE.Vector3(...end);
                const midAV = midA instanceof THREE.Vector3 ? midA : new THREE.Vector3(...midA);
                const midBV = midB instanceof THREE.Vector3 ? midB : new THREE.Vector3(...midB);
                return new THREE.CubicBezierCurve3(startV, midAV, midBV, endV).getPoints(segments);
            })
        );
    }
}
