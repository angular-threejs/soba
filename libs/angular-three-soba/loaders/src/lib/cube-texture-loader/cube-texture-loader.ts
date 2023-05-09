import { injectNgtLoader } from 'angular-three';
import { isObservable, map, Observable, of } from 'rxjs';
import * as THREE from 'three';

export function injectCubeTextureLoader(
    files: string[] | Observable<string[]>,
    path: string
): Observable<THREE.CubeTexture> {
    const inputs$ = isObservable(files) ? files.pipe(map((f) => [f])) : of([files]);
    return injectNgtLoader(
        // @ts-expect-error CubeTexture accepts a string[] and pass into loader as [[...]]
        () => THREE.CubeTextureLoader,
        inputs$,
        (loader) => loader.setPath(path)
    ).pipe(map((textures) => (textures as THREE.CubeTexture[])[0]));
}
