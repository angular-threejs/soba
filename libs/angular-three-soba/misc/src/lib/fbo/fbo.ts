import { inject } from '@angular/core';
import { injectNgtDestroy, injectNgtRef, NgtStore, safeDetectChanges } from 'angular-three';
import { isObservable, Observable, of, takeUntil } from 'rxjs';
import * as THREE from 'three';

interface FBOSettings<T extends boolean = false> extends THREE.WebGLRenderTargetOptions {
    multisample?: T;
    samples?: number;
}

export interface NgtsFBOParams<T extends boolean = false> {
    width?: number | FBOSettings<T>;
    height?: number;
    settings?: FBOSettings<T>;
}

export function injectNgtsFBO<T extends boolean = false>(
    paramsFactory: (defaultParams: Partial<NgtsFBOParams<T>>) => NgtsFBOParams<T> | Observable<NgtsFBOParams<T>>
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

        const { samples, ...targetSettings } = _settings;

        if (!targetRef.nativeElement) {
            const target = new THREE.WebGLRenderTarget(_width, _height, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                encoding: gl.outputEncoding,
                type: THREE.HalfFloatType,
                ...targetSettings,
            });
            if (samples) target.samples = samples;
            targetRef.nativeElement = target;
        }

        targetRef.nativeElement.setSize(_width, _height);
        if (samples) targetRef.nativeElement.samples = samples;
        safeDetectChanges(cdr);
    });

    return targetRef;
}
