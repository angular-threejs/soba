import { Directive, OnInit } from '@angular/core';
import { startWithUndefined } from 'angular-three';
import { combineLatest, startWith } from 'rxjs';
import { NgtsEnvironmentInputs } from './environment-inputs';
import { injectNgtsEnvironment, setEnvProps } from './utils';

@Directive({
    selector: 'ngts-environment-cube',
    standalone: true,
})
export class NgtsEnvironmentCube extends NgtsEnvironmentInputs implements OnInit {
    readonly textureRef = injectNgtsEnvironment((params) => this.select().pipe(startWith(params)));

    override initialize(): void {
        super.initialize();
        this.set({ background: false });
    }

    ngOnInit() {
        this.setEnvProps();
    }

    private setEnvProps() {
        this.effect(
            combineLatest([
                this.store.select('scene'),
                this.select('scene').pipe(startWithUndefined()),
                this.select('background'),
                this.select('blur').pipe(startWithUndefined()),
                this.textureRef.$,
            ]),
            ([defaultScene, scene, background, blur, texture]) => {
                return setEnvProps(background, scene, defaultScene, texture, blur);
            }
        );
    }
}
