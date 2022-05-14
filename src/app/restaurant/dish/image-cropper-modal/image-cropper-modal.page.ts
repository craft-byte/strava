import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';

@Component({
  selector: 'app-image-cropper-modal',
  templateUrl: './image-cropper-modal.page.html',
  styleUrls: ['./image-cropper-modal.page.scss'],
})
export class ImageCropperModalPage implements OnInit {

  croppedImage: any = '';

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) { };

  @Input() file: any;
  @Input() resolution: any;

  close() {
    this.file = null;
    this.modalCtrl.dismiss();
  }
  done() {
    this.modalCtrl.dismiss({ image: this.croppedImage, resolution: this.resolution });
  }


  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
  }
  async loadImageFailed() {
    const alert = await this.alertCtrl.create({
      header: "An error occured loading your image.",
      buttons: [
        {
          text: "Close",
        }
      ]
    });

    alert.present();
  }

  ngOnInit() {

  }

}
