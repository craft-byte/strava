import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import { DragAndDropModule } from 'src/app/directives/drag-and-drop.module';
import { threadId } from 'worker_threads';

@Component({
    selector: 'app-avatar-modal',
    templateUrl: './avatar-modal.component.html',
    styleUrls: ['./avatar-modal.component.scss'],
    standalone: true,
    imports: [ImageCropperModule, DragAndDropModule, CommonModule, IonicModule],
    animations: [
        trigger("showUp", [
            transition(":enter", [
                group([
                    style({ backgroundColor: "rgba(0,0,0,0)" }),
                    animate("200ms ease-in", style({ backgroundColor: "rgba(0,0,0,0.25)" })),
                    query(".box", [
                        style({ opacity: "0", scale: "0.8" }),
                        animate("200ms ease-in", style({ opacity: "1", scale: "1" })),
                    ])
                ])
            ]),
            transition(":leave", [
                group([
                    animate("200ms ease-in", style({ backgroundColor: "rgba(0,0,0,0)" })),
                    query(".box", [
                        style({ opacity: "1", scale: "1" }),
                        animate("200ms ease-in", style({ opacity: "0", scale: "0.8" })),
                    ])
                ])
            ]),
        ])
    ]
})
export class AvatarModalComponent implements OnInit {

    imageFile: any;
    theImage: string;

    ui = {
        showInput: true,
        showCropper: false,
    }

    constructor() { };


    @Output() leave = new EventEmitter();


    /**
     * @param event - can be FilesList or HTMLInputEvent
     * 
     * sets this.imageFile to filelist.item(0)
     * opens image cropper
     */
    fileChangeEvent(event: any) {
        if(event instanceof FileList) {

            this.imageFile = event.item(0);

            this.ui.showInput = false;
            this.ui.showCropper = true;
            return;
        }

        this.imageFile = event.target.files.item(0);

        this.ui.showInput = false;
        this.ui.showCropper = true;
    }

    /**
     * @param {ImageCroppedEvent} e
     * 
     * sets this.theImage to cropped image
     */
    imageCropped(e: ImageCroppedEvent) {
        this.theImage = e.base64;
    }


    /**
     * returns this.theImage to main settings.page
     * where it can be saved
     */
    save() {
        this.leave.emit(this.theImage);
    }

    loadImageFailed() {
        this.leave.emit("error");
    }


    ngOnInit() { }

}
