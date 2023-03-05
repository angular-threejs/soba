import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core';
import { extend, injectNgtRef, NgtAnyRecord, NgtRxStore } from 'angular-three';
import * as THREE from 'three';
import { LineBasicMaterial, LineSegments } from 'three';

extend({ LineSegments, LineBasicMaterial });

@Component({
    selector: 'ngts-edges',
    standalone: true,
    template: `
        <ngt-line-segments [ref]="edgesRef" [raycast]="noop" ngtCompound>
            <ng-container *ngIf="withChildren; else noChildren">
                <ng-content />
            </ng-container>
            <ng-template #noChildren>
                <ngt-line-basic-material [color]="color" />
            </ng-template>
        </ngt-line-segments>
    `,
    imports: [NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsEdges extends NgtRxStore implements OnInit {
    @Input() edgesRef = injectNgtRef<THREE.LineSegments>();

    @Input() set threshold(threshold: number) {
        this.set({ threshold });
    }

    @Input() set color(color: THREE.ColorRepresentation) {
        this.set({ color });
    }

    @Input() set geometry(geometry: THREE.BufferGeometry) {
        this.set({ geometry });
    }

    @Input() set userData(userData: NgtAnyRecord) {
        this.set({ userData });
    }

    @Input() withChildren = false;

    readonly noop = () => null;

    override initialize(): void {
        super.initialize();
        this.set({
            threshold: 15,
            color: 'black',
            userData: {},
        });
    }

    ngOnInit(): void {
        this.setupGeometry();
    }

    private setupGeometry(): void {
        this.hold(this.edgesRef.$, (segments) => {
            const parent = segments.parent as THREE.Mesh;
            if (parent) {
                const geom = this.get('geometry') || parent.geometry;
                const threshold = this.get('threshold');
                if (geom !== segments.userData['currentGeom'] || threshold !== segments.userData['currentThreshold']) {
                    segments.userData['currentGeom'] = geom;
                    segments.userData['currentThreshold'] = threshold;
                    segments.geometry = new THREE.EdgesGeometry(geom, threshold);
                }
            }
        });
    }
}
