import { inject } from '@angular/core';
import { injectNgtLoader, NgtLoaderResults, NgtStore } from 'angular-three';
import { Observable, tap } from 'rxjs';
import * as THREE from 'three';

export const IsObject = (url: any): url is Record<string, string> =>
    url === Object(url) && !Array.isArray(url) && typeof url !== 'function';

export function injectNgtsTextureLoader<TInput extends string[] | string | Record<string, string>>(
    input: TInput | Observable<TInput>,
    onLoad?: (texture: THREE.Texture | THREE.Texture[]) => void
): Observable<NgtLoaderResults<TInput, THREE.Texture>> {
    const store = inject(NgtStore);
    return injectNgtLoader(() => THREE.TextureLoader, input).pipe(
        tap((textures) => {
            const array = Array.isArray(textures)
                ? textures
                : textures instanceof THREE.Texture
                ? [textures]
                : Object.values(textures);
            if (onLoad) onLoad(array);
            array.forEach(store.get('gl').initTexture);
        })
    ) as Observable<NgtLoaderResults<TInput, THREE.Texture>>;
}
