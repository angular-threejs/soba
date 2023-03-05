import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, OnInit } from '@angular/core';
import { extend, getLocalState, injectBeforeRender, injectNgtRef, NgtPush, NgtRxStore, NgtStore } from 'angular-three';
import { MeshRefractionMaterial } from 'angular-three-soba/shaders';
import { combineLatest, map } from 'rxjs';
import { MeshBVH, SAH } from 'three-mesh-bvh';

extend({ MeshRefractionMaterial });

const isCubeTexture = (def: THREE.CubeTexture | THREE.Texture): def is THREE.CubeTexture =>
    def && (def as THREE.CubeTexture).isCubeTexture;

@Component({
    selector: 'ngts-mesh-refraction-material',
    standalone: true,
    template: `
        <ngt-mesh-refraction-material
            *ngIf="defines$ | ngtPush as defines"
            [ref]="materialRef"
            [defines]="defines"
            [resolution]="get('resolution')"
            [aberrationStrength]="get('aberrationStrength')"
            [envMap]="get('envMap')"
            [bounces]="get('bounces')"
            [ior]="get('ior')"
            [fresnel]="get('fresnel')"
            [color]="get('color')"
            [fastChroma]="get('fastChroma')"
            ngtCompound
            attach="material"
        >
            <ng-content />
        </ngt-mesh-refraction-material>
    `,
    imports: [NgtPush, NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshRefractionMaterial extends NgtRxStore implements OnInit {
    @Input() materialRef = injectNgtRef<typeof MeshRefractionMaterial.prototype>();
    /** Environment map */
    @Input() set envMap(envMap: THREE.CubeTexture | THREE.Texture) {
        this.set({ envMap });
    }
    /** Number of ray-cast bounces, it can be expensive to have too many, 2 */
    @Input() set bounces(bounces: number) {
        this.set({ bounces });
    }
    /** Refraction index, 2.4 */
    @Input() set ior(ior: number) {
        this.set({ ior });
    }
    /** Fresnel (strip light), 0 */
    @Input() set fresnel(fresnel: number) {
        this.set({ fresnel });
    }
    /** RGB shift intensity, can be expensive, 0 */
    @Input() set aberrationStrength(aberrationStrength: number) {
        this.set({ aberrationStrength });
    }
    /** Color, white */
    @Input() set color(color: THREE.ColorRepresentation) {
        this.set({ color });
    }
    /** If this is on it uses fewer ray casts for the RGB shift sacrificing physical accuracy, true */
    @Input() set fastChroma(fastChroma: boolean) {
        this.set({ fastChroma });
    }

    readonly defines$ = this.select('defines');

    private readonly store = inject(NgtStore);

    override initialize(): void {
        super.initialize();
        this.set({
            aberrationStrength: 0,
            fastChroma: true,
        });
    }

    constructor() {
        super();
        this.connect(
            'defines',
            combineLatest([this.select('aberrationStrength'), this.select('fastChroma'), this.select('envMap')]).pipe(
                map(([aberrationStrength, fastChroma, envMap]) => {
                    const temp = {} as { [key: string]: string };
                    // Sampler2D and SamplerCube need different defines
                    const isCubeMap = isCubeTexture(envMap);
                    const w = (isCubeMap ? envMap.image[0]?.width : envMap.image.width) ?? 1024;
                    const cubeSize = w / 4;
                    const _lodMax = Math.floor(Math.log2(cubeSize));
                    const _cubeSize = Math.pow(2, _lodMax);
                    const width = 3 * Math.max(_cubeSize, 16 * 7);
                    const height = 4 * _cubeSize;
                    if (isCubeMap) temp['ENVMAP_TYPE_CUBEM'] = '';
                    temp['CUBEUV_TEXEL_WIDTH'] = `${1.0 / width}`;
                    temp['CUBEUV_TEXEL_HEIGHT'] = `${1.0 / height}`;
                    temp['CUBEUV_MAX_MIP'] = `${_lodMax}.0`;
                    // Add defines from chromatic aberration
                    if (aberrationStrength > 0) temp['CHROMATIC_ABERRATIONS'] = '';
                    if (fastChroma) temp['FAST_CHROMA'] = '';
                    return temp;
                })
            )
        );
        this.connect('resolution', this.store.select('size').pipe(map((size) => [size.width, size.height])));

        injectBeforeRender(({ camera }) => {
            if (this.materialRef.nativeElement) {
                (this.materialRef.nativeElement as any)!.viewMatrixInverse = camera.matrixWorld;
                (this.materialRef.nativeElement as any)!.projectionMatrixInverse = camera.projectionMatrixInverse;
            }
        });
    }

    ngOnInit() {
        this.setupGeometry();
    }

    private setupGeometry() {
        this.hold(this.materialRef.$, (material) => {
            const geometry = getLocalState(material).parent?.geometry;
            if (geometry) {
                (material as any).bvh.updateFrom(
                    new MeshBVH(geometry.toNonIndexed(), { lazyGeneration: false, strategy: SAH } as any)
                );
            }
        });
    }
}
