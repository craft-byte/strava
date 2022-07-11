import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-cropper',
  templateUrl: './cropper.page.html',
  styleUrls: ['./cropper.page.scss'],
})
export class CropperPage implements OnInit {
  image: string;

  constructor(
    private modalCtrl: ModalController,
  ) { };

  @Input() event: any;

  done() {
    this.modalCtrl.dismiss(this.image);
  }
  imageCropped(image: any) {
    this.image = image.base64;
  }
  cancel() {
    this.modalCtrl.dismiss();
  }
  loadImageFailed() {
    this.modalCtrl.dismiss(null, "error")
  }

  ngOnInit() {
  }

}
