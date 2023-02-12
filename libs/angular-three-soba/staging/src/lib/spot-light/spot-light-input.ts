import { Directive, Input } from '@angular/core';
import { NgtRxStore } from 'angular-three';

@Directive()
export abstract class NgtsSpotLightInput extends NgtRxStore {
    @Input() set depthBuffer(depthBuffer: THREE.DepthTexture) {
        this.set({ depthBuffer });
    }

    @Input() set angle(angle: number) {
        this.set({ angle });
    }

    @Input() set distance(distance: number) {
        this.set({ distance });
    }

    @Input() set attenuation(attenuation: number) {
        this.set({ attenuation });
    }

    @Input() set anglePower(anglePower: number) {
        this.set({ anglePower });
    }

    @Input() set radiusTop(radiusTop: number) {
        this.set({ radiusTop });
    }

    @Input() set radiusBottom(radiusBottom: number) {
        this.set({ radiusBottom });
    }

    @Input() set opacity(opacity: number) {
        this.set({ opacity });
    }

    @Input() set color(color: string | number) {
        this.set({ color });
    }

    @Input() set debug(debug: boolean) {
        this.set({ debug });
    }
}
