import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    EventEmitter,
    inject,
    InjectionToken,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, is, NgtRxStore, NgtStore } from 'angular-three';
import { combineLatest, switchMap } from 'rxjs';
import * as THREE from 'three';
import { Group } from 'three';

export interface NgtsBoundsSize {
    box: THREE.Box3;
    size: THREE.Vector3;
    center: THREE.Vector3;
    distance: number;
}

export interface NgtsBoundsApi {
    getSize: () => NgtsBoundsSize;
    refresh: (object?: THREE.Object3D | THREE.Box3) => NgtsBoundsApi;
    clip: () => NgtsBoundsApi;
    fit: () => NgtsBoundsApi;
    to: ({
        position,
        target,
    }: {
        position: [number, number, number];
        target?: [number, number, number];
    }) => NgtsBoundsApi;
}

type ControlsProto = {
    update(): void;
    target: THREE.Vector3;
    maxDistance: number;
    addEventListener: (event: string, callback: (event: any) => void) => void;
    removeEventListener: (event: string, callback: (event: any) => void) => void;
};

const isBox3 = (def: unknown): def is THREE.Box3 => !!def && (def as THREE.Box3).isBox3;

function equals(a: THREE.Vector3, b: THREE.Vector3, eps: number) {
    return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps && Math.abs(a.z - b.z) < eps;
}

function damp(v: THREE.Vector3, t: THREE.Vector3, lambda: number, delta: number) {
    v.x = THREE.MathUtils.damp(v.x, t.x, lambda, delta);
    v.y = THREE.MathUtils.damp(v.y, t.y, lambda, delta);
    v.z = THREE.MathUtils.damp(v.z, t.z, lambda, delta);
}

export const NGTS_BOUNDS_API = new InjectionToken<NgtsBoundsApi>('NgtsBounds API');

function boundsApiFactory(bounds: NgtsBounds) {
    const store = inject(NgtStore);
    const box = new THREE.Box3();

    function getSize() {
        const camera = store.get('camera');
        const margin = bounds.get('margin');

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);
        const fitHeightDistance = is.orthographicCamera(camera)
            ? maxSize * 4
            : maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
        const fitWidthDistance = is.orthographicCamera(camera) ? maxSize * 4 : fitHeightDistance / camera.aspect;
        const distance = margin * Math.max(fitHeightDistance, fitWidthDistance);
        return { box, size, center, distance };
    }

    const api = {
        getSize,
        refresh(object?: THREE.Object3D | THREE.Box3) {
            const { camera, controls: storeControls } = store.get();
            const controls = storeControls as unknown as ControlsProto;

            if (isBox3(object)) box.copy(object);
            else {
                const target = object || bounds.boundsRef.nativeElement;
                if (target) {
                    target.updateWorldMatrix(true, true);
                    box.setFromObject(target);
                }
            }
            if (box.isEmpty()) {
                const max = camera.position.length() || 10;
                box.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(max, max, max));
            }

            if (controls?.constructor.name === 'OrthographicTrackballControls') {
                // put camera on a sphere along which it would move
                const { distance } = getSize();
                const direction = camera.position.clone().sub(controls.target).normalize().multiplyScalar(distance);
                const newPos = controls.target.clone().add(direction);
                camera.position.copy(newPos);
            }
            return this;
        },
        clip() {
            const { distance } = getSize();
            const { camera, controls: storeControls, invalidate } = store.get();
            const controls = storeControls as unknown as ControlsProto;
            if (controls) controls.maxDistance = distance * 10;
            camera.near = distance / 100;
            camera.far = distance * 100;
            camera.updateProjectionMatrix();
            if (controls) controls.update();
            invalidate();
            return this;
        },
        to({ position, target }: { position: [number, number, number]; target?: [number, number, number] }) {
            const { camera } = store.get();
            const { damping } = bounds.get();

            bounds.current.camera.copy(camera.position);
            const { center } = getSize();
            bounds.goal.camera.set(...position);

            if (target) {
                bounds.goal.focus.set(...target);
            } else {
                bounds.goal.focus.copy(center);
            }

            if (damping) {
                bounds.current.animating = true;
            } else {
                camera.position.set(...position);
            }

            return this;
        },
        fit() {
            const { camera, controls: storeControls, invalidate } = store.get();
            const controls = storeControls as unknown as ControlsProto;

            const { damping, margin } = bounds.get();

            bounds.current.camera.copy(camera.position);
            if (controls) bounds.current.focus.copy(controls.target);

            const { center, distance } = getSize();
            const direction = center.clone().sub(camera.position).normalize().multiplyScalar(distance);

            bounds.goal.camera.copy(center).sub(direction);
            bounds.goal.focus.copy(center);

            if (is.orthographicCamera(camera)) {
                bounds.current.zoom = camera.zoom;

                let maxHeight = 0,
                    maxWidth = 0;
                const vertices = [
                    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
                    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
                    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
                    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
                    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
                    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
                    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
                    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
                ];
                // Transform the center and each corner to camera space
                center.applyMatrix4(camera.matrixWorldInverse);
                for (const v of vertices) {
                    v.applyMatrix4(camera.matrixWorldInverse);
                    maxHeight = Math.max(maxHeight, Math.abs(v.y - center.y));
                    maxWidth = Math.max(maxWidth, Math.abs(v.x - center.x));
                }
                maxHeight *= 2;
                maxWidth *= 2;
                const zoomForHeight = (camera.top - camera.bottom) / maxHeight;
                const zoomForWidth = (camera.right - camera.left) / maxWidth;
                bounds.goal.zoom = Math.min(zoomForHeight, zoomForWidth) / margin;
                if (!damping) {
                    camera.zoom = bounds.goal.zoom;
                    camera.updateProjectionMatrix();
                }
            }

            if (damping) {
                bounds.current.animating = true;
            } else {
                camera.position.copy(bounds.goal.camera);
                camera.lookAt(bounds.goal.focus);
                if (controls) {
                    controls.target.copy(bounds.goal.focus);
                    controls.update();
                }
            }
            if (bounds.fitted.observed) bounds.fitted.emit(this.getSize());
            invalidate();
            return this;
        },
    } as NgtsBoundsApi;

    let count = 0;
    bounds.hold(
        bounds.boundsRef.$.pipe(
            switchMap(() =>
                combineLatest([
                    bounds.select('clip'),
                    bounds.select('fit'),
                    bounds.select('observe'),
                    store.select('camera'),
                    store.select('controls'),
                    store.select('size'),
                    bounds.boundsRef.children$(),
                ])
            )
        ),
        ([clip, fit, observe]) => {
            if (observe || count++ === 0) {
                api.refresh();
                if (fit) api.fit();
                if (clip) api.clip();
            }
        }
    );

    injectBeforeRender(({ delta }) => {
        if (bounds.current.animating) {
            const { damping, eps } = bounds.get();
            const { camera, controls: storeControls, invalidate } = store.get();
            const controls = storeControls as unknown as ControlsProto;

            damp(bounds.current.focus, bounds.goal.focus, damping, delta);
            damp(bounds.current.camera, bounds.goal.camera, damping, delta);
            bounds.current.zoom = THREE.MathUtils.damp(bounds.current.zoom, bounds.goal.zoom, damping, delta);
            camera.position.copy(bounds.current.camera);

            if (is.orthographicCamera(camera)) {
                camera.zoom = bounds.current.zoom;
                camera.updateProjectionMatrix();
            }

            if (!controls) {
                camera.lookAt(bounds.current.focus);
            } else {
                controls.target.copy(bounds.current.focus);
                controls.update();
            }

            invalidate();
            if (is.orthographicCamera(camera) && !(Math.abs(bounds.current.zoom - bounds.goal.zoom) < eps)) return;
            if (!is.orthographicCamera(camera) && !equals(bounds.current.camera, bounds.goal.camera, eps)) return;
            if (controls && !equals(bounds.current.focus, bounds.goal.focus, eps)) return;
            bounds.current.animating = false;
        }
    });

    return api;
}

extend({ Group });

@Component({
    selector: 'ngts-bounds',
    standalone: true,
    template: `
        <ngt-group ngtCompound [ref]="groupRef">
            <ng-content />
        </ngt-group>
    `,
    providers: [{ provide: NGTS_BOUNDS_API, useFactory: boundsApiFactory, deps: [NgtsBounds] }, RxActionFactory],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsBounds extends NgtRxStore implements OnInit {
    @Input() boundsRef = injectNgtRef<Group>();

    @Input() set damping(damping: number) {
        this.set({ damping });
    }

    @Input() set fit(fit: boolean) {
        this.set({ fit });
    }

    @Input() set clip(clip: boolean) {
        this.set({ clip });
    }

    @Input() set observe(observe: boolean) {
        this.set({ observe });
    }

    @Input() set margin(margin: number) {
        this.set({ margin });
    }

    @Input() set eps(eps: number) {
        this.set({ eps });
    }

    @Output() fitted = new EventEmitter<NgtsBoundsSize>();

    private readonly store = inject(NgtStore);

    readonly current = { animating: false, focus: new THREE.Vector3(), camera: new THREE.Vector3(), zoom: 1 };
    readonly goal = { focus: new THREE.Vector3(), camera: new THREE.Vector3(), zoom: 1 };

    override initialize() {
        super.initialize();
        this.set({ damping: 6, fit: false, clip: false, observe: false, margin: 1.2, eps: 0.01 });
    }

    ngOnInit() {
        this.preventDragHijacking();
    }

    private preventDragHijacking() {
        this.effect(this.store.select('controls'), (controls) => {
            if (controls) {
                const callback = () => (this.current.animating = false);
                (controls as unknown as ControlsProto).addEventListener('start', callback);
                return () => (controls as unknown as ControlsProto).removeEventListener('start', callback);
            }
        });
    }
}
