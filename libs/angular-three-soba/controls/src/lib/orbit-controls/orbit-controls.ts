import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import {
    injectBeforeRender,
    injectNgtRef,
    NgtArgs,
    NgtPush,
    NgtRxStore,
    NgtStore,
    startWithUndefined,
} from 'angular-three';
import { combineLatest, map } from 'rxjs';
import { OrbitControls } from 'three-stdlib';

@Component({
    selector: 'ngts-orbit-controls',
    standalone: true,
    template: `
        <ngt-primitive *args="get('args')" ngtCompound [enableDamping]="enableDamping$ | ngtPush" />
    `,
    imports: [NgtArgs, NgtPush],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsOrbitControls extends NgtRxStore implements OnInit {
    @Input() controlsRef = injectNgtRef<OrbitControls>();

    @Input() set camera(camera: THREE.Camera) {
        this.set({ camera });
    }

    @Input() set domElement(domElement: HTMLElement) {
        this.set({ domElement });
    }

    @Input() set makeDefault(makeDefault: boolean) {
        this.set({ makeDefault });
    }

    @Input() set regress(regress: boolean) {
        this.set({ regress });
    }

    @Input() set target(target: THREE.Vector3 | Parameters<THREE.Vector3['set']>) {
        this.set({ target });
    }

    @Input() set enableDamping(enableDamping: boolean) {
        this.set({ enableDamping });
    }

    @Output() change = new EventEmitter<THREE.Event>();
    @Output() start = new EventEmitter<THREE.Event>();
    @Output() end = new EventEmitter<THREE.Event>();

    private readonly store = inject(NgtStore);

    readonly enableDamping$ = this.select('enableDamping');

    constructor() {
        super();
        injectBeforeRender(() => {
            const controls = this.controlsRef.nativeElement;
            if (controls && controls.enabled) {
                controls.update();
            }
        });
    }

    override initialize(): void {
        super.initialize();
        this.set({ enableDamping: true, regress: false });
    }

    ngOnInit() {
        this.setControls();
        this.connectElement();
        this.makeControlsDefault();
        this.setEvents();
        this.connect('args', this.controlsRef.$.pipe(map((controls) => [controls])));
    }

    private setControls() {
        this.hold(
            combineLatest([this.store.select('camera'), this.select('camera').pipe(startWithUndefined())]),
            ([defaultCamera, camera]) => {
                const controlsCamera = camera || defaultCamera;
                if (!this.controlsRef.nativeElement || this.controlsRef.nativeElement.object !== controlsCamera) {
                    this.controlsRef.nativeElement = new OrbitControls(controlsCamera);
                }
            }
        );
    }

    private connectElement() {
        this.hold(
            combineLatest([
                this.store.select('gl', 'domElement'),
                this.store.select('invalidate'),
                this.select('regress'),
                this.controlsRef.$,
            ]),
            ([glDom, , , controls]) => {
                const { events } = this.store.get();
                const domElement = this.get('domElement') || events.connected || glDom;
                controls.connect(domElement);
            }
        );
    }

    private makeControlsDefault() {
        this.effect(combineLatest([this.controlsRef.$, this.select('makeDefault')]), ([controls, makeDefault]) => {
            if (makeDefault) {
                const oldControls = this.store.get('controls');
                this.store.set({ controls });
                return () => {
                    this.store.set({ controls: oldControls });
                };
            }
        });
    }

    private setEvents() {
        this.effect(this.controlsRef.$, (controls) => {
            const { invalidate, performance } = this.store.get();
            const regress = this.get('regress');

            const changeCallback: (e: THREE.Event) => void = (e) => {
                invalidate();
                if (regress) performance.regress();
                if (this.change.observed) this.change.emit(e);
            };

            const startCallback = this.start.observed ? this.start.emit.bind(this.start) : null;
            const endCallback = this.end.observed ? this.end.emit.bind(this.end) : null;

            controls.addEventListener('change', changeCallback);
            if (startCallback) controls.addEventListener('start', startCallback);
            if (endCallback) controls.addEventListener('end', endCallback);

            return () => {
                controls.removeEventListener('change', changeCallback);
                if (startCallback) controls.removeEventListener('start', startCallback);
                if (endCallback) controls.removeEventListener('end', endCallback);
            };
        });
    }
}
