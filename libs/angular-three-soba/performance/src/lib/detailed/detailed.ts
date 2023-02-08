import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core';
import { extend, injectNgtRef, NgtRef, NgtRxStore } from 'angular-three';
import { combineLatest } from 'rxjs';
import { LOD } from 'three';

extend({ LOD });

@Component({
    selector: 'ngts-detailed[distances]',
    standalone: true,
    template: `
        <ngt-lOD *ref="lodRef" ngtCompound (beforeRender)="$any($event).object.update($any($event).state.camera)">
            <ng-content />
        </ngt-lOD>
    `,
    imports: [NgtRef],
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

    private updateLodChildren() {
        this.hold(combineLatest([this.lodRef.children$(), this.select('distances')]), ([children, distances]) => {
            this.lodRef.nativeElement.levels.length = 0;
            children.forEach((child, index) => {
                this.lodRef.nativeElement.addLevel(child, distances[index]);
            });
        });
    }
}
