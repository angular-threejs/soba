import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core';
import { extend, injectNgtRef, NgtBeforeRenderEvent, NgtRxStore } from 'angular-three';
import { combineLatest } from 'rxjs';
import { LOD } from 'three';

extend({ LOD });

@Component({
    selector: 'ngts-detailed[distances]',
    standalone: true,
    template: `
        <ngt-lOD [ref]="lodRef" ngtCompound (beforeRender)="onLODBeforeRender($any($event))">
            <ng-content />
        </ngt-lOD>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsDetailed extends NgtRxStore implements OnInit {
    @Input() lodRef = injectNgtRef<LOD>();

    @Input() set distances(distances: number[]) {
        this.set({ distances });
    }

    ngOnInit() {
        this.updateLodChildren();
    }

    onLODBeforeRender({ object, state }: NgtBeforeRenderEvent<THREE.LOD>) {
        object.update(state.camera);
    }

    private updateLodChildren() {
        this.hold(combineLatest([this.lodRef.children$(), this.select('distances')]), ([children, distances]) => {
            this.lodRef.nativeElement.levels.length = 0;
            children.forEach((child, index) => {
                this.lodRef.nativeElement.addLevel(child, distances[index]);
            });
        });
    }
}
