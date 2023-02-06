import { Directive, inject, Input, OnInit } from '@angular/core';
import { injectNgtRef, NgtCamera, NgtRxStore, NgtStore } from 'angular-three';
import { injectNgtsFBO } from 'angular-three-soba/misc';
import { combineLatest, map } from 'rxjs';

@Directive()
export abstract class NgtsCamera<TCamera extends NgtCamera> extends NgtRxStore implements OnInit {
    @Input() set makeDefault(makeDefault: boolean) {
        this.set({ makeDefault });
    }

    @Input() set manual(manual: boolean) {
        this.set({ manual });
    }

    @Input() set frames(frames: number) {
        this.set({ frames });
    }

    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }

    @Input() set envMap(envMap: THREE.Texture) {
        this.set({ envMap });
    }

    @Input() cameraRef = injectNgtRef<TCamera>();

    protected readonly store = inject(NgtStore);
    readonly fboRef = injectNgtsFBO(() => this.select('resolution').pipe(map((resolution) => ({ width: resolution }))));

    override initialize() {
        super.initialize();
        this.set({ resolution: 256, frames: Infinity, makeDefault: false, manual: false });
    }

    ngOnInit() {
        this.hold(this.cameraRef.$, (camera) => {
            camera.updateProjectionMatrix();
            this.setDefaultCamera();
            this.updateProjectionMatrix();
        });
    }

    private setDefaultCamera() {
        this.effect(combineLatest([this.cameraRef.$, this.select('makeDefault')]), ([camera, makeDefault]) => {
            if (makeDefault) {
                const { camera: oldCamera } = this.store.get();
                this.store.set({ camera });
                return () => {
                    this.store.set({ camera: oldCamera });
                };
            }
        });
    }

    private updateProjectionMatrix() {
        this.effect(combineLatest([this.cameraRef.$, this.select('manual')]), ([camera, manual]) => {
            if (!manual && camera) camera.updateProjectionMatrix();
        });
    }
}
