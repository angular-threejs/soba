import { Directive, inject, OnInit } from '@angular/core';
import { NgtRxStore, NgtStore } from 'angular-three';

@Directive({ selector: 'ngts-bake-shadows', standalone: true })
export class NgtsBakeShadows extends NgtRxStore implements OnInit {
    private readonly store = inject(NgtStore);

    ngOnInit() {
        this.effect(this.store.select('gl'), (gl) => {
            gl.shadowMap.autoUpdate = false;
            gl.shadowMap.needsUpdate = true;

            return () => {
                gl.shadowMap.autoUpdate = gl.shadowMap.needsUpdate = true;
            };
        });
    }
}
