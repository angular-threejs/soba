import { Directive, Input } from '@angular/core';
import { NgtRxStore } from 'angular-three';

@Directive()
export abstract class NgtsSpotLightShadowMeshInput extends NgtRxStore {
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
    }

    @Input() set width(width: number) {
        this.set({ width });
    }

    @Input() set height(height: number) {
        this.set({ height });
    }
}
