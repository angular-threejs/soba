import { injectBeforeRender, NgtInjectedRef, NgtRxStore } from 'angular-three';
import { combineLatest, startWith } from 'rxjs';
import * as THREE from 'three';

const isSpotLight = (child: THREE.Object3D | null): child is THREE.SpotLight => {
    return (child as THREE.SpotLight)?.isSpotLight;
};

export function injectShadowMeshCommon(
    spotLight: NgtInjectedRef<THREE.SpotLight>,
    mesh: NgtInjectedRef<THREE.Mesh>,
    width: number,
    height: number,
    distance: number
) {
    const pos = new THREE.Vector3();
    const dir = new THREE.Vector3();

    const commonEffect = (instance: NgtRxStore) => {
        instance.hold(
            combineLatest([
                spotLight.$,
                instance.select('width').pipe(startWith(width)),
                instance.select('height').pipe(startWith(height)),
            ]),
            ([light, width, height]) => {
                if (isSpotLight(light)) {
                    console.log('[NGTS] SpotLight instance -->', light);
                    light.shadow.mapSize.set(width, height);
                    light.shadow.needsUpdate = true;
                } else {
                    throw new Error('<ngts-spot-light-shadow> must be a child of a <ngts-spot-light>');
                }
            }
        );
    };

    injectBeforeRender(() => {
        if (!spotLight.nativeElement) return;

        const A = spotLight.nativeElement.position;
        const B = spotLight.nativeElement.target.position;

        dir.copy(B).sub(A);
        const len = dir.length();
        dir.normalize().multiplyScalar(len * distance);
        pos.copy(A).add(dir);

        mesh.nativeElement.position.copy(pos);
        mesh.nativeElement.lookAt(spotLight.nativeElement.target.position);
    });

    return commonEffect;
}
