import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController, PopoverController } from '@ionic/angular';
import { ResuloutionComponent } from '../resuloution/resuloution.component';

@Component({
  selector: 'app-image',
  templateUrl: './image.page.html',
  styleUrls: ['./image.page.scss'],
})
export class ImagePage implements OnInit {

  resolution: number = 1;
  image: string;

  constructor(
    private pc: PopoverController,
    private ac: AlertController,
    private mc: ModalController
  ) { };


  @Input() event: any;

  close() {
    this.mc.dismiss();
  }

  async setResolution(e: any) {
    const popover = await this.pc.create({
      component: ResuloutionComponent,
      mode: "ios",
      event: e
    });

    await popover.present();

    const { role } = await popover.onDidDismiss();

    if(role && role != "backdrop") {
      this.resolution = Number(role);
    }
  }

  async loadImageFailed() {
    this.mc.dismiss();
    const alert = await this.ac.create({
      header: "Failed to load image.",
      buttons: [
        {
          text: "Close",
        }
      ]
    });

    alert.present();
  }
  imageCropped(e: any) {
    this.image = e.base64;
  }
  done() {
    this.mc.dismiss({ image: this.image, resolution: this.resolution });
  }

  ngOnInit() {
  }

}
