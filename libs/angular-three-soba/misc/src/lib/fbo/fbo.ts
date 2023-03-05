import { inject } from '@angular/core';
import { injectNgtDestroy, injectNgtRef, NgtStore, safeDetectChanges } from 'angular-three';
import { isObservable, Observable, of, takeUntil } from 'rxjs';
import * as THREE from 'three';

interface FBOSettings extends THREE.WebGLRenderTargetOptions {
    /** Defines the count of MSAA samples. Can only be used with WebGL 2. Default: 0 */
    samples?: number;
    /** If set, the scene depth will be rendered into buffer.depthTexture. Default: false */
    depth?: boolean;
}

export interface NgtsFBOParams {
    width?: number | FBOSettings;
    height?: number;
    settings?: FBOSettings;
}

export function injectNgtsFBO(
    paramsFactory: (defaultParams: Partial<NgtsFBOParams>) => NgtsFBOParams | Observable<NgtsFBOParams>
) {
    const store = inject(NgtStore);
    const targetRef = injectNgtRef<THREE.WebGLRenderTarget>();
    const { destroy$, cdr } = injectNgtDestroy(() => {
        targetRef.nativeElement?.dispose();
    });
    const params = paramsFactory({});
    const params$ = isObservable(params) ? params : of(params);

    params$.pipe(takeUntil(destroy$)).subscribe(({ width, height, settings }) => {
        const { gl, size, viewport } = store.get();
        const _width = typeof width === 'number' ? width : size.width * viewport.dpr;
        const _height = typeof height === 'number' ? height : size.height * viewport.dpr;
        const _settings = (typeof width === 'number' ? settings : (width as FBOSettings)) || {};

        const { samples = 0, depth, ...targetSettings } = _settings;

        if (!targetRef.nativeElement) {
            const target = new THREE.WebGLRenderTarget(_width, _height, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                encoding: gl.outputEncoding,
                type: THREE.HalfFloatType,
                ...targetSettings,
            });
            if (depth) target.depthTexture = new THREE.DepthTexture(_width, _height, THREE.FloatType);

            target.samples = samples;
            targetRef.nativeElement = target;
        }

        targetRef.nativeElement.setSize(_width, _height);
        if (samples) targetRef.nativeElement.samples = samples;
        safeDetectChanges(cdr);
    });

    return targetRef;
}
