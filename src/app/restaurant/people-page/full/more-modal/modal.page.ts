import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { RestaurantService } from 'src/app/restaurant/services/restaurant.service';
import { FireModalPage } from '../fire-modal/fire-modal.page';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.page.html',
  styleUrls: ['./modal.page.scss'],
})
export class ModalPage implements OnInit {

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private service: RestaurantService,
    private router: Router,
  ) { };

  @Input() userId: string;
  @Input() name: string;


  close() {
    this.modalCtrl.dismiss();
  }


  async fire() {
    const modal = await this.modalCtrl.create({
      component: FireModalPage,
      id: "more",
      mode: "ios",
      cssClass: "modal-width",
      swipeToClose: true,
      componentProps: {
        name: this.name,
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    
    if(data) {
      this.modalCtrl.dismiss(null, null, "more");
      const result: any = await this.service.patch(data, "staff", this.userId, "fire");
      this.router.navigate(["restaurant", this.service.restaurantId, "people", "staff"], { replaceUrl: true });

      if(result.updated) {
        (await this.toastCtrl.create({
          message: "User fired successfuly.",
          color: 'green',
          mode: 'ios',
          duration: 4000
        })).present();
      } else {
        (await this.toastCtrl.create({
          message: "Something went wrong. Try again later.",
          color: 'red',
          mode: 'ios',
          duration: 4000
        })).present();
      }
    }


  }

  ngOnInit() {
  }

}
