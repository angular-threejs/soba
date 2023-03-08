import { injectBeforeRender, injectNgtDestroy, injectNgtRef, NgtInjectedRef } from 'angular-three';
import { Observable, takeUntil } from 'rxjs';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

type Api = {
    ref: NgtInjectedRef<THREE.Object3D>;
    clips: THREE.AnimationClip[];
    mixer: THREE.AnimationMixer;
    names: string[];
    actions: Record<string, THREE.AnimationAction>;
};

export function injectNgtsAnimations(
    gltf$: Observable<GLTF>,
    modelSelector: (gltf: GLTF) => THREE.Object3D = (gltf) => gltf.scene
): Api {
    const ref = injectNgtRef<THREE.Object3D>();
    const mixer = new THREE.AnimationMixer(null!);
    const actions = {} as Record<string, THREE.AnimationAction>;
    let cached = {} as Record<string, THREE.AnimationAction>;

    const clips = [] as THREE.AnimationClip[];
    const names = [] as string[];

    const { destroy$ } = injectNgtDestroy(() => {
        // clear cached
        cached = {};
        // uncache actions
        Object.values(actions).forEach((action) => {
            if (ref.nativeElement) {
                mixer.uncacheAction(action as unknown as THREE.AnimationClip, ref.nativeElement);
            }
        });
        // stop all actions
        mixer.stopAllAction();
    });

    injectBeforeRender(({ delta }) => mixer.update(delta));

    gltf$.pipe(takeUntil(destroy$)).subscribe((gltf) => {
        const model = modelSelector(gltf);
        ref.nativeElement = model;

        for (let i = 0; i < gltf.animations.length; i++) {
            const clip = gltf.animations[i];

            names.push(clip.name);
            clips.push(clip);

            Object.defineProperty(actions, clip.name, {
                enumerable: true,
                get: () => {
                    return cached[clip.name] || (cached[clip.name] = mixer.clipAction(clip, model));
                },
            });

            if (i === 0) {
                actions[clip.name].play();
            }
        }
    });

    return { ref, actions, mixer, names, clips };
}
