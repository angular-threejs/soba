import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { injectNgtRef, startWithUndefined } from 'angular-three';
import { combineLatest, map } from 'rxjs';
import * as THREE from 'three';
import { CatmullRomCurve3 } from 'three';
import { Line2 } from 'three-stdlib';
import { NgtsLine } from '../line/line';
import { NgtsLineInput } from '../line/line-input';

@Component({
    selector: 'ngts-catmull-rom-line[points]',
    standalone: true,
    template: `
        <ngts-line
            [lineRef]="lineRef"
            [points]="get('segmentedPoints')"
            [color]="get('color')"
            [vertexColors]="get('interpolatedVertexColors')"
            [resolution]="get('resolution')"
            [lineWidth]="get('lineWidth')"
            [alphaToCoverage]="get('alphaToCoverage')"
            [dashed]="get('dashed')"
            [dashScale]="get('dashScale')"
            [dashOffset]="get('dashOffset')"
            [dashSize]="get('dashSize')"
            [gapSize]="get('gapSize')"
            [wireframe]="get('wireframe')"
            [worldUnits]="get('worldUnits')"
        />
    `,
    imports: [NgtsLine],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCatmullRomLine extends NgtsLineInput {
    @Input() lineRef = injectNgtRef<Line2>();

    @Input() set points(
        points: Array<THREE.Vector3 | THREE.Vector2 | [number, number, number] | [number, number] | number>
    ) {
        this.set({ points });
    }

    @Input() set closed(closed: boolean) {
        this.set({ closed });
    }

    @Input() set curveType(curveType: 'centripetal' | 'chordal' | 'catmullrom') {
        this.set({ curveType });
    }

    @Input() set tension(tension: number) {
        this.set({ tension });
    }

    @Input() set segments(segments: number) {
        this.set({ segments });
    }

    override initialize(): void {
        super.initialize();
        this.set({ closed: false, curveType: 'centripetal', tension: 0.5, segments: 64 });
        this.connect(
            'curve',
            combineLatest([
                this.select('points'),
                this.select('closed'),
                this.select('curveType'),
                this.select('tension'),
            ]).pipe(
                map(([points, closed, curveType, tension]) => {
                    const mappedPoints = (points as NgtsCatmullRomLine['points']).map((p) =>
                        p instanceof THREE.Vector3 ? p : new THREE.Vector3(...(p as [number, number, number]))
                    );
                    return new CatmullRomCurve3(mappedPoints, closed, curveType, tension);
                })
            )
        );

        this.connect(
            'segmentedPoints',
            combineLatest([this.select('curve'), this.select('segments')]).pipe(
                map(([curve, segments]) => curve.getPoints(segments))
            )
        );

        this.connect(
            'interpolatedVertexColors',
            combineLatest([this.select('vertexColors').pipe(startWithUndefined()), this.select('segments')]).pipe(
                map(([vertexColors, segments]) => {
                    if (!vertexColors || vertexColors.length < 2) return undefined;
                    if (vertexColors.length === segments + 1) return vertexColors;

                    const mappedColors = vertexColors.map((color: THREE.Color | [number, number, number]) =>
                        color instanceof THREE.Color ? color : new THREE.Color(...color)
                    );
                    if (this.get('closed')) mappedColors.push(mappedColors[0].clone());

                    const iColors: THREE.Color[] = [mappedColors[0]];
                    const divisions = segments / (mappedColors.length - 1);
                    for (let i = 0; i < segments; i++) {
                        const alpha = (i % divisions) / divisions;
                        const colorIndex = Math.floor(i / divisions);
                        iColors.push(mappedColors[colorIndex].clone().lerp(mappedColors[colorIndex + 1], alpha));
                    }
                    iColors.push(mappedColors[mappedColors.length - 1]);
                })
            )
        );
    }
}
