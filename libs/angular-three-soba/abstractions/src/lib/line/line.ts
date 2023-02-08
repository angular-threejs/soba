import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, OnInit } from '@angular/core';
import { injectNgtRef, NgtAfterAttach, NgtArgs, NgtStore, startWithUndefined } from 'angular-three';
import { combineLatest, map } from 'rxjs';
import * as THREE from 'three';
import { Line2, LineGeometry, LineMaterial, LineSegments2, LineSegmentsGeometry } from 'three-stdlib';
import { NgtsLineInput } from './line-input';

@Component({
    selector: 'ngts-line[points]',
    standalone: true,
    template: `
        <ngt-primitive *args="[line]" [ref]="lineRef" ngtCompound>
            <ngt-primitive
                *args="[get('lineGeometry')]"
                attach="geometry"
                (afterAttach)="onAfterAttach($any($event))"
            />
            <ngt-primitive
                *args="[lineMaterial]"
                attach="material"
                [color]="get('color')"
                [vertexColors]="Boolean(get('vertexColors'))"
                [resolution]="get('materialResolution')"
                [linewidth]="get('lineWidth')"
                [alphaToCoverage]="get('alphaToCoverage')"
                [dashed]="get('dashed')"
                [dashScale]="get('dashScale') ?? lineMaterial.dashScale"
                [dashSize]="get('dashSize') ?? lineMaterial.dashSize"
                [dashOffset]="get('dashOffset') ?? lineMaterial.dashOffset"
                [gapSize]="get('gapSize') ?? lineMaterial.gapSize"
                [wireframe]="get('wireframe') ?? lineMaterial.wireframe"
                [worldUnits]="get('worldUnits')"
            />
        </ngt-primitive>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsLine extends NgtsLineInput implements OnInit {
    readonly Boolean = Boolean;
    readonly lineMaterial = new LineMaterial();

    private readonly store = inject(NgtStore);

    line: Line2 | LineSegments2 | null = null;

    @Input() lineRef = injectNgtRef<LineSegments2 | Line2>();

    @Input() set points(
        points: Array<THREE.Vector3 | THREE.Vector2 | [number, number, number] | [number, number] | number>
    ) {
        this.set({ points });
    }

    @Input() set segments(segments: boolean) {
        this.set({ segments });
    }

    onAfterAttach({ parent }: NgtAfterAttach<Line2 | LineSegments2>) {
        parent.computeLineDistances();
    }

    override initialize(): void {
        super.initialize();
        this.set({ segments: false });
        this.connect(
            'lineGeometry',
            combineLatest([
                this.select('points'),
                this.select('segments'),
                this.select('vertexColors').pipe(startWithUndefined()),
            ]).pipe(
                map(([points, segments, vertexColors]) => {
                    const geometry = segments ? new LineSegmentsGeometry() : new LineGeometry();
                    const pValues = (points as NgtsLine['points']).map((p) => {
                        const isArray = Array.isArray(p);
                        return p instanceof THREE.Vector3
                            ? [p.x, p.y, p.z]
                            : p instanceof THREE.Vector2
                            ? [p.x, p.y, 0]
                            : isArray && p.length === 3
                            ? [p[0], p[1], p[2]]
                            : isArray && p.length === 2
                            ? [p[0], p[1], 0]
                            : p;
                    });

                    geometry.setPositions(pValues.flat());

                    if (vertexColors) {
                        const cValues = (vertexColors as NgtsLineInput['vertexColors']).map((c) =>
                            c instanceof THREE.Color ? c.toArray() : c
                        );
                        geometry.setColors(cValues.flat());
                    }

                    return geometry;
                })
            )
        );
    }

    ngOnInit() {
        this.connect(
            'materialResolution',
            combineLatest([this.store.select('size'), this.select('resolution').pipe(startWithUndefined())]).pipe(
                map(([size, resolution]) => resolution ?? [size.width, size.height])
            )
        );

        this.line = this.get('segments') ? new LineSegments2() : new Line2();

        this.disposeGeometry();
    }

    private disposeGeometry() {
        this.effect(this.select('lineGeometry'), (lineGeometry: LineGeometry) => {
            return () => lineGeometry.dispose();
        });
    }
}
