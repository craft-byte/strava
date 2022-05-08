import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { IonNav, ModalController, NavController, ToastController } from '@ionic/angular';
import { FirePage } from '../fire/fire.page';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.page.html',
  styleUrls: ['./settings-modal.page.scss'],
})
export class SettingsModalPage implements OnInit {

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) { };

  @Input() name: string;
  @Input() _id: string;


  async fire() {
    const modal = await this.modalCtrl.create({
      component: FirePage,
      mode: "ios",
      swipeToClose: true,
      cssClass: "department-modal",
      componentProps: {
        name: this.name,
        _id: this._id
      }
    });

    modal.present();

    const { data } = await modal.onDidDismiss();

    if(data) {
      this.modalCtrl.dismiss(null, null, 'settings');
      (await this.toastCtrl.create({
        duration: 4000,
        message: `${this.name} was successfuly fired.`,
        color: "green"
      })).present();
    }
  }

  close() {
    this.modalCtrl.dismiss();
  }


  ngOnInit(): void {
    
  }

}
