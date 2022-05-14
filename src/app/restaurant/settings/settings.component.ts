import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { RestaurantSettings } from 'src/models/components';
import { Restaurant } from 'src/models/general';
import { RadminService } from '../radmin.service';
import { NameModalPage } from './name-modal/name-modal.page';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {

  restaurant: Restaurant;
  settings: RestaurantSettings;

  timeout: any;

  ui = {
    showDanger: false
  }

  constructor(
    private service: RadminService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private route: ActivatedRoute,
    private router: Router,
    private alertCtrl: AlertController
  ) { };

  async name() {
    const modal = await this.modalCtrl.create({
      component: NameModalPage,
      mode: "ios",
      cssClass: "department-modal",
      swipeToClose: true,
      componentProps: {
        name: this.restaurant.name,
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if(data) {
      const result = await this.service.patch<any>(data, "update", "name");

      if(result.updated) {
        this.restaurant.name = data.name;
        (await this.toastCtrl.create({
          duration: 4000,
          message: "Name was successfuly updated.",
          color: "green",
          mode: "ios"
        })).present();
      } else {
        (await this.toastCtrl.create({
          duration: 4000,
          message: "Something went wrong. Try again later.",
          color: "red",
          mode: "ios"
        })).present();
      }
    }
  }

  async change(f1: string, f2: string) {
    this.settings[f1][f2] = !this.settings[f1][f2];

    const result: any = await this.service.patch({ value: this.settings[f1][f2], f1, f2 }, "settings");

    if(!result.updated) {
      (await this.toastCtrl.create({
        duration: 4000,
        message: "Something went wrong. Try again later.",
        color: "red",
        mode: "ios"
      }));
    }
  }

  customerDishes({ target: { value } }) {
    this.timeout = setTimeout(async () => {
      const result: any = await this.service.patch({ value: value, f1: "customers", f2: "maxDishes" }, "settings");
      if(!result.updated) {
        (await this.toastCtrl.create({
          duration: 4000,
          message: "Something went wrong. Try again later.",
          color: "red",
          mode: "ios"
        }));
      }
    }, 3000);
  }

  async remove() {
    const alert = await this.alertCtrl.create({
      header: "Be certain.",
      subHeader: "All the data about this restaurant will removed for ever.",
      buttons: [
        {
          text: "Cancel",
          role: "cancel"
        },
        {
          text: "Remove",
          role: "remove"
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();



    if(role == "remove") {
      const result: any = await this.service.delete();

      if(result.removed) {
        this.router.navigate(["user/info"], { replaceUrl: true });
        (await this.toastCtrl.create({
          duration: 4000,
          color: "green",
          message: "Restaurant successfuly removed.",
          mode: "ios"
        })).present();
      } else {
        (await this.toastCtrl.create({
          duration: 4000,
          color: "red",
          message: "Something went wrong. Try again later.",
          mode: "ios"
        })).present();
      }
    }
  }

  async ngOnInit() {
    const restauratId = this.route.snapshot.params["restaurantId"];
    this.restaurant = await this.service.getRestaurant(restauratId);
    this.settings = await this.service.get("settings");

    this.ui.showDanger = (this.settings as any).showDanger;
  }

}
