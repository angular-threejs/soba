import { injectBeforeRender, injectNgtDestroy, injectNgtRef, NgtInjectedRef } from 'angular-three';
import { map, Observable, switchMap, takeUntil } from 'rxjs';
import * as THREE from 'three';
import { AnimationClip } from 'three';

type Api = {
    ref: NgtInjectedRef<THREE.Object3D>;
    clips: THREE.AnimationClip[];
    mixer: THREE.AnimationMixer;
    names: string[];
    actions: Record<string, THREE.AnimationAction>;
};

export function injectNgtsAnimations(
    animations$: Observable<AnimationClip[]>,
    ref?: NgtInjectedRef<THREE.Object3D> | THREE.Object3D
): Api {
    let actualRef = injectNgtRef<THREE.Object3D>();

    if (ref) {
        if (ref instanceof THREE.Object3D) {
            actualRef.nativeElement = ref;
        } else {
            actualRef = ref;
        }
    }

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
            if (actualRef.nativeElement) {
                mixer.uncacheAction(action as unknown as THREE.AnimationClip, actualRef.nativeElement);
            }
        });
        // stop all actions
        mixer.stopAllAction();
    });

    injectBeforeRender(({ delta }) => mixer.update(delta));

    actualRef.$.pipe(takeUntil(destroy$))
        .pipe(switchMap((object) => animations$.pipe(map((animations) => [object, animations] as const))))
        .subscribe(([object, animations]) => {
            for (let i = 0; i < animations.length; i++) {
                const clip = animations[i];

                names.push(clip.name);
                clips.push(clip);

                Object.defineProperty(actions, clip.name, {
                    enumerable: true,
                    get: () => {
                        return cached[clip.name] || (cached[clip.name] = mixer.clipAction(clip, object));
                    },
                });

                if (i === 0) {
                    actions[clip.name].play();
                }
            }
        });

    return { ref: actualRef, actions, mixer, names, clips };
}
