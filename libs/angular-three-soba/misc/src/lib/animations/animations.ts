import { injectBeforeRender, injectNgtDestroy, injectNgtRef, is, NgtInjectedRef } from 'angular-three';
import { isObservable, Observable, Subscription } from 'rxjs';
import { AnimationMixer } from 'three';

type Api<T extends THREE.AnimationClip> = {
    ref: NgtInjectedRef<THREE.Object3D>;
    clips: THREE.AnimationClip[];
    mixer: THREE.AnimationMixer;
    names: T['name'][];
    actions: { [key in T['name']]: THREE.AnimationAction | null };
};

export function injectNgtsAnimations<T extends THREE.AnimationClip>(
    clips: T[],
    object?: Observable<THREE.Object3D> | THREE.Object3D | NgtInjectedRef<THREE.Object3D>
): Api<T> {
    let ref = injectNgtRef<THREE.Object3D>();

    let sub: Subscription;

    if (object) {
        if (isObservable(object)) {
            sub = object.subscribe((val) => {
                ref.nativeElement = val;
            });
        } else if (is.ref(object)) {
            ref = object;
        } else {
            ref.nativeElement = object;
        }
    }

    const mixer = new AnimationMixer(ref.nativeElement);

    let cached = {} as { [key in T['name']]: THREE.AnimationAction | null };
    const actions = {} as { [key in T['name']]: THREE.AnimationAction | null };
    const names = [] as T['name'][];

    for (const clip of clips) {
        names.push(clip.name);
        Object.defineProperty(actions, clip.name, {
            enumerable: true,
            get: () => {
                if (ref.nativeElement) {
                    const name = clip.name as keyof typeof cached;
                    return cached[name] || (cached[name] = mixer.clipAction(clip, ref.nativeElement));
                }
            },
        });
    }

    const api = { ref, clips, actions, names, mixer };

    injectNgtDestroy(() => {
        if (sub) sub.unsubscribe();
        cached = {} as { [key in T['name']]: THREE.AnimationAction | null };
        Object.values(api.actions).forEach((action) => {
            if (ref.nativeElement) {
                mixer.uncacheAction(action as THREE.AnimationClip, ref.nativeElement);
            }
        });
        mixer.stopAllAction();
    });

    injectBeforeRender(({ delta }) => mixer.update(delta));

    return api;
}
