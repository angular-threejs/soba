import { NgIf } from '@angular/common';
import {
    Component,
    ComponentRef,
    createEnvironmentInjector,
    CUSTOM_ELEMENTS_SCHEMA,
    EnvironmentInjector,
    inject,
    InjectionToken,
    Input,
    OnDestroy,
    OnInit,
    Type,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { extend, NgtArgs, NgtCanvas, NgtPerformance, NgtRxStore } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { debounceTime, Observable } from 'rxjs';
import { AmbientLight, Color, PointLight } from 'three';

interface CanvasOptions {
    camera?: {
        position?: [number, number, number];
        fov?: number;
    };
    performance?: Partial<Omit<NgtPerformance, 'regress'>>;
    whiteBackground?: boolean;
    controls?:
        | boolean
        | {
              makeDefault?: boolean;
          };
    lights?: boolean;
    compoundPrefixes?: string[];
}

const defaultCanvasOptions: CanvasOptions = {
    camera: {
        position: [-5, 5, 5],
        fov: 75,
    },
    performance: {
        current: 1,
        min: 0.5,
        max: 1,
        debounce: 200,
    },
    whiteBackground: false,
    controls: true,
    lights: true,
};

extend({ Color, AmbientLight, PointLight });

const CANVAS_OPTIONS = new InjectionToken<CanvasOptions>('canvas options');
const STORY_COMPONENT = new InjectionToken<Type<unknown>>('story component');
const STORY_INPUTS = new InjectionToken<Observable<Record<string, unknown>>>('story inputs');

@Component({
    standalone: true,
    template: `
        <ng-container *ngIf="canvasOptions.whiteBackground">
            <ngt-color *args="['white']" attach="background" />
        </ng-container>

        <ng-container *ngIf="canvasOptions.lights">
            <ngt-ambient-light [intensity]="0.8" />
            <ngt-point-light [intensity]="1" [position]="[0, 6, 0]" />
        </ng-container>

        <ng-container *ngIf="canvasOptions.controls">
            <ngts-orbit-controls [makeDefault]="canvasOptions.controls?.makeDefault" />
        </ng-container>

        <ng-container #anchor />
    `,
    imports: [NgIf, NgtArgs, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class StorybookScene extends NgtRxStore implements OnInit, OnDestroy {
    readonly canvasOptions = inject(CANVAS_OPTIONS);
    readonly story = inject(STORY_COMPONENT);
    readonly inputs$ = inject(STORY_INPUTS);

    @ViewChild('anchor', { read: ViewContainerRef, static: true })
    anchor!: ViewContainerRef;
    private ref?: ComponentRef<unknown>;

    ngOnInit() {
        const ref = (this.ref = this.anchor.createComponent(this.story));

        this.hold(this.inputs$, (inputs) => {
            for (const key of Object.keys(inputs)) {
                ref.setInput(key, inputs[key]);
            }
            ref.changeDetectorRef.detectChanges();
        });

        this.ref.changeDetectorRef.detectChanges();
    }

    override ngOnDestroy() {
        this.ref?.destroy();
        super.ngOnDestroy();
    }
}

@Component({
    selector: 'storybook-setup[story]',
    standalone: true,
    template: '<ng-container #anchor />',
})
export class StorybookSetup extends NgtRxStore implements OnInit, OnDestroy {
    @Input() options: CanvasOptions = defaultCanvasOptions;
    @Input() story!: Type<unknown>;
    @Input() set inputs(inputs: Record<string, unknown>) {
        this.set({ inputs });
    }

    @ViewChild('anchor', { read: ViewContainerRef, static: true })
    anchor!: ViewContainerRef;

    private ref?: ComponentRef<unknown>;
    private refEnvInjector?: EnvironmentInjector;
    readonly envInjector = inject(EnvironmentInjector);

    override initialize(): void {
        super.initialize();
        this.set({ inputs: {} });
    }

    ngOnInit() {
        this.refEnvInjector = createEnvironmentInjector(
            [
                { provide: CANVAS_OPTIONS, useValue: this.options },
                { provide: STORY_COMPONENT, useValue: this.story },
                { provide: STORY_INPUTS, useValue: this.select('inputs').pipe(debounceTime(0)) },
            ],
            this.envInjector
        );
        this.ref = this.anchor.createComponent(NgtCanvas, { environmentInjector: this.refEnvInjector });
        this.ref.setInput('shadows', true);
        this.ref.setInput('performance', this.options.performance);
        this.ref.setInput('camera', this.options.camera);
        this.ref.setInput('compoundPrefixes', this.options.compoundPrefixes);
        this.ref.setInput('sceneGraph', StorybookScene);
        this.ref.changeDetectorRef.detectChanges();
    }

    override ngOnDestroy() {
        this.ref?.destroy();
        this.refEnvInjector?.destroy();
        super.ngOnDestroy();
    }
}

type DeepPartial<T> = T extends Function
    ? T
    : T extends Array<infer ArrayItemType>
    ? DeepPartialArray<ArrayItemType>
    : T extends object
    ? DeepPartialObject<T>
    : T | undefined;

type DeepPartialArray<T> = Array<DeepPartial<T>>;

type DeepPartialObject<T> = {
    [Key in keyof T]?: DeepPartial<T[Key]>;
};

export function makeCanvasOptions(options: DeepPartial<CanvasOptions> = {}) {
    const mergedOptions = {
        ...defaultCanvasOptions,
        camera: { ...defaultCanvasOptions.camera, ...(options.camera || {}) },
        performance: { ...defaultCanvasOptions.performance, ...(options.performance || {}) },
        whiteBackground: options.whiteBackground ?? defaultCanvasOptions.whiteBackground,
        controls: options.controls ?? defaultCanvasOptions.controls,
        lights: options.lights ?? defaultCanvasOptions.lights,
        compoundPrefixes: options.compoundPrefixes ?? defaultCanvasOptions.compoundPrefixes,
    } as Required<CanvasOptions>;
    return mergedOptions;
}

export function turn(object: THREE.Object3D) {
    object.rotation.y += 0.01;
}
