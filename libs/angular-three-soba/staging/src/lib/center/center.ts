import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { extend, injectNgtRef, NgtRxStore } from 'angular-three';
import { combineLatest } from 'rxjs';
import { Box3, Group, Sphere, Vector3 } from 'three';

extend({ Group });

@Component({
    selector: 'ngts-center',
    standalone: true,
    template: `
        <ngt-group ngtCompound [ref]="centerRef">
            <ngt-group [ref]="outerRef">
                <ngt-group [ref]="innerRef">
                    <ng-content />
                </ngt-group>
            </ngt-group>
        </ngt-group>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCenter extends NgtRxStore implements OnInit {
    @Input() centerRef = injectNgtRef<Group>();

    readonly outerRef = injectNgtRef<Group>();
    readonly innerRef = injectNgtRef<Group>();

    @Input() set top(top: boolean) {
        this.set({ top });
    }

    @Input() set right(right: boolean) {
        this.set({ right });
    }

    @Input() set bottom(bottom: boolean) {
        this.set({ bottom });
    }

    @Input() set left(left: boolean) {
        this.set({ left });
    }

    @Input() set front(front: boolean) {
        this.set({ front });
    }

    @Input() set back(back: boolean) {
        this.set({ back });
    }

    @Input() set disableX(disableX: boolean) {
        this.set({ disableX });
    }

    @Input() set disableY(disableY: boolean) {
        this.set({ disableY });
    }

    @Input() set disableZ(disableZ: boolean) {
        this.set({ disableZ });
    }

    @Input() set disabled(disabled: boolean) {
        this.set({ disabled });
    }

    @Input() set precise(precise: boolean) {
        this.set({ precise });
    }

    @Output() centered = new EventEmitter<{
        /** The next parent above <Center> */
        parent: THREE.Object3D;
        /** The outmost container group of the <Center> component */
        container: THREE.Object3D;
        width: number;
        height: number;
        depth: number;
        boundingBox: THREE.Box3;
        boundingSphere: THREE.Sphere;
        center: THREE.Vector3;
        verticalAlignment: number;
        horizontalAlignment: number;
        depthAlignment: number;
    }>();

    override initialize(): void {
        super.initialize();
        this.set({ precise: true });
    }

    ngOnInit(): void {
        this.setPosition();
    }

    private setPosition() {
        this.hold(
            combineLatest([this.centerRef.$, this.outerRef.$, this.innerRef.$, this.innerRef.children$()]),
            ([centerGroup, outerGroup, innerGroup]) => {
                const { precise, top, left, front, disabled, disableX, disableY, disableZ, back, bottom, right } =
                    this.get();
                outerGroup.matrixWorld.identity();
                const box3 = new Box3().setFromObject(innerGroup, precise);
                const center = new Vector3();
                const sphere = new Sphere();
                const width = box3.max.x - box3.min.x;
                const height = box3.max.y - box3.min.y;
                const depth = box3.max.z - box3.min.z;

                box3.getCenter(center);
                box3.getBoundingSphere(sphere);

                const vAlign = top ? height / 2 : bottom ? -height / 2 : 0;
                const hAlign = left ? -width / 2 : right ? width / 2 : 0;
                const dAlign = front ? depth / 2 : back ? -depth / 2 : 0;

                outerGroup.position.set(
                    disabled || disableX ? 0 : -center.x + hAlign,
                    disabled || disableY ? 0 : -center.y + vAlign,
                    disabled || disableZ ? 0 : -center.z + dAlign
                );

                if (this.centered.observed) {
                    this.centered.emit({
                        parent: centerGroup.parent!,
                        container: centerGroup,
                        width,
                        height,
                        depth,
                        boundingBox: box3,
                        boundingSphere: sphere,
                        center: center,
                        verticalAlignment: vAlign,
                        horizontalAlignment: hAlign,
                        depthAlignment: dAlign,
                    });
                }
            }
        );
    }
}
