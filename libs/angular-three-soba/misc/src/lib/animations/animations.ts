import { injectBeforeRender, injectNgtDestroy, injectNgtRef, is, NgtInjectedRef } from 'angular-three';
import { AnimationMixer } from 'three';

type Api<T extends THREE.AnimationClip> = {
    (clips: T[], object?: THREE.Object3D | NgtInjectedRef<THREE.Object3D>): void;
    ref: NgtInjectedRef<THREE.Object3D>;
    clips: THREE.AnimationClip[];
    mixer: THREE.AnimationMixer;
    names: T['name'][];
    actions: { [key in T['name']]: THREE.AnimationAction | null };
};

export function injectNgtsAnimations<T extends THREE.AnimationClip>() {
    let ref = injectNgtRef<THREE.Object3D>();

    const mixer = new AnimationMixer(null!);
    const cleanUps = [] as (() => void)[];

    injectNgtDestroy(() => {
        cleanUps.forEach((cleanUp) => cleanUp());
    });

    injectBeforeRender(({ delta }) => mixer.update(delta));

    const api = <T extends THREE.AnimationClip>(
        clips: T[],
        object?: THREE.Object3D | NgtInjectedRef<THREE.Object3D>
    ) => {
        let cached = {} as { [key in T['name']]: THREE.AnimationAction | null };
        const actions = {} as { [key in T['name']]: THREE.AnimationAction | null };
        const names = [] as T['name'][];

        if (object) {
            if (is.ref(object)) {
                ref = object;
            } else {
                ref.nativeElement = object;
            }
        }

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

        cleanUps.push(() => {
            cached = {} as { [key in T['name']]: THREE.AnimationAction | null };
            Object.values(actions).forEach((action) => {
                if (ref.nativeElement) {
                    mixer.uncacheAction(action as THREE.AnimationClip, ref.nativeElement);
                }
            });
            mixer.stopAllAction();
        });

        (api as Api<T>).clips = clips;
        (api as Api<T>).actions = actions;
        (api as Api<T>).names = names;
    };

    api.ref = ref;
    api.mixer = mixer;

    return api as Api<T>;
}
