import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, Input, OnInit } from '@angular/core';
import { addAfterEffect, addEffect, is, NgtAnyRecord, NgtRxStore, startWithUndefined } from 'angular-three';
import { combineLatest } from 'rxjs';
import * as Stats from 'stats.js';

@Directive({
    selector: 'ngts-stats',
    standalone: true,
})
export class NgtsStats extends NgtRxStore implements OnInit {
    private readonly document = inject(DOCUMENT);
    private readonly stats: Stats = (Stats as NgtAnyRecord)['default']
        ? new (Stats as NgtAnyRecord)['default']()
        : new Stats();

    @Input() set showPanel(showPanel: number) {
        this.set({ showPanel: showPanel === undefined ? this.get('showPanel') : showPanel });
    }

    @Input() set parent(parent: HTMLElement | ElementRef<HTMLElement>) {
        this.set({ parent: is.ref(parent) ? parent.nativeElement : parent });
    }

    @Input() set classes(classes: string) {
        this.set({ classes });
    }

    @Input() set right(right: boolean) {
        this.set({ right });
    }

    override initialize(): void {
        super.initialize();
        this.set({ showPanel: 0, right: false });
    }

    ngOnInit() {
        this.effect(
            combineLatest([
                this.select('showPanel'),
                this.select('right'),
                this.select('parent').pipe(startWithUndefined()),
                this.select('classes').pipe(startWithUndefined()),
            ]),
            ([showPanel, right, parent, classes]) => {
                const node = parent ?? this.document.body;
                this.stats.showPanel(showPanel);
                node.appendChild(this.stats.dom);
                if (classes) {
                    this.stats.dom.classList.add(...classes.split(' ').filter((cls: string) => cls));
                }
                if (right) {
                    this.stats.dom.style.right = '0px';
                    this.stats.dom.style.left = 'inherit';
                } else {
                    this.stats.dom.style.left = '0px';
                    this.stats.dom.style.right = 'inherit';
                }
                const begin = addEffect(() => this.stats.begin());
                const end = addAfterEffect(() => this.stats.end());
                return () => {
                    node.removeChild(this.stats.dom);
                    begin();
                    end();
                };
            }
        );
    }
}
