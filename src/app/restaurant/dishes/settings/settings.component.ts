import { Component, OnInit } from '@angular/core';
import { Restaurant } from 'src/models/general';
import { RestaurantSettings } from 'src/models/components';
import { RadminService } from '../../radmin.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {

  restaurant: Restaurant;
  settings: RestaurantSettings;

  constructor(
    private service: RadminService,
    private toastCtrl: ToastController
  ) { };

  async set(t: string) {
    this.settings.dishes[t] = !this.settings.dishes[t];
    const result: any = await this.service.patch({ value: this.settings.dishes[t], f1: "dishes", f2: t }, "settings");

    if(!result.updated) {
      (await this.toastCtrl.create({
        duration: 4000,
        color: "red",
        mode: "ios",
        message: "Something went wrong. Try again later."
      })).present();
    }
  }

  async ngOnInit() {
    this.restaurant = await this.service.getRestaurant();
    this.settings = await this.service.get("settings");
  }

}
