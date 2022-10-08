import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import { DragAndDropModule } from 'src/app/directives/drag-and-drop.module';

@Component({
    selector: 'app-image-modal',
    templateUrl: './image-modal.component.html',
    styleUrls: ['./image-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, DragAndDropModule, ImageCropperModule, IonicModule],
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
export class ImageModalComponent implements OnInit {

    currentFile: File;
    resolution: number = 1;
    resultImage: string;

    ui = {
        showInput: true,
        showCropper: false,
    }

    constructor(
        private toastCtrl: ToastController,
    ) { };


    @Output() leave = new EventEmitter();

    /**
     * @param { number } r - resolution can be 1 / 1.33 / 1.77
     */
     setResolution(r: number) {
        this.resolution = r;
    }
    /**
     * when image cropped saved to this.resultImage
     * @param { ImageCroppedEvent } e
     */
    imageCropped(e: ImageCroppedEvent) {
        this.resultImage = e.base64;
    }

    /**
     * @param {FileList | FileInputEvent } e 
     * when dragged and dropped or on input[type=file] change
     */
    fileChangeEvent(e: any) {
        if(e instanceof FileList) {
            this.currentFile = e.item(0);
        } else {
            this.currentFile = e.target.files.item(0);
        }

        if(this.currentFile) {
            this.ui.showCropper = true;
            this.ui.showInput = false;
        } else {
            this.loadImageFailed();
        }
    }

    /**
     * if image load failed
     */
    async loadImageFailed() {
        this.ui.showCropper = false;
        this.ui.showInput = true;
        (await this.toastCtrl.create({
            duration: 1500,
            color: "red",
            mode: "ios",
            message: "Couldn't upload image. Please try again",
        })).present();
    }

    /**
     * returns this.resultImage to dish-add.page
     */
    save() {
        this.leave.emit({ binary: this.resultImage, resolution: this.resolution });
    }

    ngOnInit() {

    }

}
