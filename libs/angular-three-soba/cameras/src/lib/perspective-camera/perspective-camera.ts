import { NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, ContentChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { extend } from 'angular-three';
import { Group, PerspectiveCamera } from 'three';
import { NgtsCamera } from '../camera/camera';
import { NgtsCameraContent } from '../camera/camera-content';

extend({ PerspectiveCamera, Group });

@Component({
    selector: 'ngts-perspective-camera',
    standalone: true,
    template: `
        <ngt-perspective-camera [ref]="cameraRef" ngtCompound>
            <ng-container
                *ngIf="cameraContent && !cameraContent.ngtsCameraContent"
                [ngTemplateOutlet]="cameraContent.template"
            />
        </ngt-perspective-camera>
        <ngt-group #group *ngIf="cameraContent && cameraContent.ngtsCameraContent">
            <ng-container *ngTemplateOutlet="cameraContent.template; context: { fbo: fboRef.nativeElement, group }" />
        </ngt-group>
    `,
    imports: [NgIf, NgTemplateOutlet],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsPerspectiveCamera extends NgtsCamera<PerspectiveCamera> {
    @ContentChild(NgtsCameraContent) cameraContent?: NgtsCameraContent;
}
