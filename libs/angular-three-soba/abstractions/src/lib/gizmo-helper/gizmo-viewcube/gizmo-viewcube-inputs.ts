import { Directive, EventEmitter, inject, Input } from '@angular/core';
import { NgtRxStore, NgtStore, NgtThreeEvent } from 'angular-three';

@Directive()
export abstract class NgtsGizmoViewcubeInputs extends NgtRxStore {
    protected readonly store = inject(NgtStore);

    @Input() set opacity(opacity: number) {
        this.set({ opacity });
    }

    @Input() set hoverColor(hoverColor: string) {
        this.set({ hoverColor });
    }

    @Input() set textColor(textColor: string) {
        this.set({ textColor });
    }

    @Input() set strokeColor(strokeColor: string) {
        this.set({ strokeColor });
    }

    @Input() set faces(faces: string[]) {
        this.set({ faces });
    }

    @Input() set clickEmitter(clickEmitter: EventEmitter<NgtThreeEvent<MouseEvent>>) {
        this.set({ clickEmitter });
    }
}
