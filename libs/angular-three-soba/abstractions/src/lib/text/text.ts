import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    EventEmitter,
    inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';
import { RxActionFactory } from '@rx-angular/state/actions';
import { injectNgtRef, NgtArgs, NgtRxStore, NgtStore } from 'angular-three';
// @ts-ignore
import { preloadFont, Text } from 'troika-three-text';

@Component({
    selector: 'ngts-text[text]',
    standalone: true,
    template: `
        <ng-container>
            <ngt-primitive
                ngtCompound
                *args="[troikaText]"
                [ref]="textRef"
                [text]="get('text')"
                [anchorX]="get('anchorX')"
                [anchorY]="get('anchorY')"
                [font]="get('font')"
            >
                <ng-content />
            </ngt-primitive>
        </ng-container>
    `,
    imports: [NgtArgs],
    providers: [RxActionFactory],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsText extends NgtRxStore implements OnInit, OnDestroy {
    @Input() textRef = injectNgtRef<Text>();

    @Input() set text(text: string) {
        this.set({ text });
    }

    @Input() set characters(characters: string) {
        this.set({ characters });
    }

    @Input() set font(font: string) {
        this.set({ font });
    }

    @Input() set anchorX(anchorX: number | 'left' | 'center' | 'right') {
        this.set({ anchorX });
    }

    @Input() set anchorY(anchorY: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom') {
        this.set({ anchorY });
    }

    @Output() sync = new EventEmitter<Text>();

    override initialize(): void {
        super.initialize();
        this.set({ anchorX: 'center', anchorY: 'middle', text: '' });
    }

    private readonly store = inject(NgtStore);
    readonly troikaText = new Text();

    ngOnInit(): void {
        this.preloadFont();
        this.syncText();
    }

    override ngOnDestroy(): void {
        this.troikaText.dispose();
        super.ngOnDestroy();
    }

    private preloadFont() {
        const { font, characters } = this.get();
        if (font && characters) {
            preloadFont({ font, characters });
        }
    }

    private syncText() {
        this.hold(this.select(), () => {
            const invalidate = this.store.get('invalidate');
            this.troikaText.sync(() => {
                invalidate();
                if (this.sync.observed) this.sync.next(this.troikaText);
            });
        });
    }
}
