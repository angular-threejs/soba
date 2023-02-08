import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, NgtArgs, NgtRenderState, NgtRxStore } from 'angular-three';
import { shaderMaterial } from 'angular-three-soba/shaders';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, Spherical, Vector3 } from 'three';

const StarFieldMaterial = shaderMaterial(
    {
        time: 0.0,
        fade: 0.0,
    },
    // language=GLSL
    `
uniform float time;
attribute float size;
varying vec3 vColor;
void main() {
  vColor = color;
  vec4 mvPosition = modelViewMatrix * vec4(position, 0.5);
  gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
  gl_Position = projectionMatrix * mvPosition;
}
  `,
    // language=GLSL
    `
uniform sampler2D pointTexture;
uniform float fade;
varying vec3 vColor;
void main() {
  float opacity = 1.0;
  if (fade == 1.0) {
    float d = distance(gl_PointCoord, vec2(0.5, 0.5));
    opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
  }
  gl_FragColor = vec4(vColor, opacity);

  #include <tonemapping_fragment>
  #include <encodings_fragment>
}
  `
);

extend({ Points, BufferGeometry, BufferAttribute });

const genStar = (r: number) => {
    return new Vector3().setFromSpherical(
        new Spherical(r, Math.acos(1 - Math.random() * 2), Math.random() * 2 * Math.PI)
    );
};

@Component({
    selector: 'ngts-stars',
    standalone: true,
    template: `
        <ngt-points [ref]="starsRef">
            <ngt-buffer-geometry>
                <ngt-buffer-attribute attach="attributes.position" *args="[get('bufferAttributes').positions, 3]" />
                <ngt-buffer-attribute attach="attributes.color" *args="[get('bufferAttributes').colors, 3]" />
                <ngt-buffer-attribute attach="attributes.size" *args="[get('bufferAttributes').sizes, 1]" />
            </ngt-buffer-geometry>
            <ngt-primitive
                *args="[material]"
                attach="material"
                [blending]="AdditiveBlending"
                [depthWrite]="false"
                [transparent]="true"
                [vertexColors]="true"
            >
                <ngt-value attach="uniforms.fade.value" [rawValue]="get('fade')" />
            </ngt-primitive>
        </ngt-points>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsStars extends NgtRxStore {
    readonly AdditiveBlending = AdditiveBlending;
    readonly material = new StarFieldMaterial();

    @Input() starsRef = injectNgtRef<Points>();

    @Input() set radius(radius: number) {
        this.set({ radius });
    }

    @Input() set depth(depth: number) {
        this.set({ depth });
    }

    @Input() set count(count: number) {
        this.set({ count });
    }

    @Input() set factor(factor: number) {
        this.set({ factor });
    }

    @Input() set saturation(saturation: number) {
        this.set({ saturation });
    }

    @Input() set fade(fade: boolean) {
        this.set({ fade });
    }

    @Input() set speed(speed: number) {
        this.set({ speed });
    }

    override initialize(): void {
        super.initialize();
        this.set({
            radius: 100,
            depth: 50,
            count: 5000,
            saturation: 0,
            factor: 4,
            fade: false,
            speed: 1,
        });
        this.connect(
            'bufferAttributes',
            this.select(
                ['count', 'depth', 'factor', 'radius', 'saturation'],
                ({ count, depth, factor, radius, saturation }) => {
                    const positions: any[] = [];
                    const colors: any[] = [];
                    const sizes = Array.from({ length: count }, () => (0.5 + 0.5 * Math.random()) * factor);
                    const color = new Color();
                    let r = radius + depth;
                    const increment = depth / count;
                    for (let i = 0; i < count; i++) {
                        r -= increment * Math.random();
                        positions.push(...genStar(r).toArray());
                        color.setHSL(i / count, saturation, 0.9);
                        colors.push(color.r, color.g, color.b);
                    }
                    return {
                        positions: new Float32Array(positions),
                        colors: new Float32Array(colors),
                        sizes: new Float32Array(sizes),
                    };
                }
            )
        );
    }

    constructor() {
        super();
        injectBeforeRender(this.onBeforeRender.bind(this));
    }

    onBeforeRender({ clock }: NgtRenderState) {
        this.material.uniforms['time'].value = clock.getElapsedTime() * this.get('speed');
    }
}
