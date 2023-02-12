import { ChangeDetectorRef, Directive, inject, Input } from '@angular/core';
import { NgtRxStore } from 'angular-three';

@Directive()
export abstract class NgtsSpotLightShadowMeshInput extends NgtRxStore {
    private readonly cdr = inject(ChangeDetectorRef);

    @Input() set distance(distance: number) {
        this.set({ distance });
    }

    @Input() set alphaTest(alphaTest: number) {
        this.set({ alphaTest });
    }

    @Input() set scale(scale: number) {
        this.set({ scale });
    }

    @Input() set map(map: THREE.Texture) {
        this.set({ map });
    }

    @Input() set shader(shader: string) {
        this.set({ shader });
        this.cdr.detectChanges();
    }

    @Input() set width(width: number) {
        this.set({ width });
    }

    @Input() set height(height: number) {
        this.set({ height });
    }
}
