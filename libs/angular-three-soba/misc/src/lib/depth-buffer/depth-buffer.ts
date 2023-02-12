import { inject } from '@angular/core';
import { injectBeforeRender, injectNgtDestroy, injectNgtRef, NgtStore } from 'angular-three';
import { combineLatest, isObservable, map, Observable, of, takeUntil } from 'rxjs';
import * as THREE from 'three';
import { injectNgtsFBO } from '../fbo/fbo';

export interface NgtsDepthBufferParams {
    size: number;
    frames: number;
}

export function injectNgtsDepthBuffer(
    paramsFactory: (
        defaultParams: Partial<NgtsDepthBufferParams>
    ) => NgtsDepthBufferParams | Observable<NgtsDepthBufferParams> = (params) => params as NgtsDepthBufferParams
) {
    const depthBufferRef = injectNgtRef<THREE.DepthTexture>();

    const store = inject(NgtStore);
    const { destroy$ } = injectNgtDestroy();

    const params = paramsFactory({ size: 256, frames: Infinity });
    const params$ = isObservable(params) ? params : of(params);

    let rawParams = { size: 256, frames: Infinity };

    const fbo = injectNgtsFBO(() => {
        return combineLatest([params$, store.select('size'), store.select('viewport', 'dpr')]).pipe(
            map(([params, size, dpr]) => {
                rawParams = params;
                const w = params.size || size.width * dpr;
                const h = params.size || size.height * dpr;
                const depthTexture = new THREE.DepthTexture(w, h);
                depthTexture.format = THREE.DepthFormat;
                depthTexture.type = THREE.UnsignedShortType;
                const depthConfig = { depthTexture };

                return { width: w, height: h, settings: depthConfig };
            })
        );
    });

    let count = 0;
    injectBeforeRender(({ gl, scene, camera }) => {
        if ((rawParams.frames === Infinity || count < rawParams.frames) && fbo.nativeElement) {
            gl.setRenderTarget(fbo.nativeElement);
            gl.render(scene, camera);
            gl.setRenderTarget(null);
            count++;
        }
    });

    fbo.$.pipe(takeUntil(destroy$)).subscribe((fbo) => {
        depthBufferRef.nativeElement = fbo.depthTexture;
    });

    return depthBufferRef;
}
