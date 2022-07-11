import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { RestaurantSettings } from 'src/models/components';
import { RestaurantService } from '../services/restaurant.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  settings: RestaurantSettings;
  timeout: any;
  timeout2: any;
  timeout3: any;


  constructor(
    private service: RestaurantService,
    private toastCtrl: ToastController,
  ) { };

  select(field1: string, field2: string, event: any) {    
    const { target: { value } } = event;

    clearTimeout(this.timeout3);

    this.timeout3 = setTimeout(async () => {
      const result: any = await this.service.post({ field1, field2, value: value == "true" ? true : false }, "settings");

      this.toast(result.updated);

      if(result.updated) {
        this.settings[field1][field2] = value == "true" ? true : false;
      }
    }, 600);
  }

  check(field1: string, field2: string, event: any) {
    clearTimeout(this.timeout2);

    this.timeout2 = setTimeout(async () => {
      const result: any = await this.service.post({ field1, field2, value: event.target.checked ? "unlimited" : 0 }, "settings");

      this.toast(result.updated);

      if(result.updated) {
        this.settings[field1][field2] = event.target.checked ? "unlimited" : 0;
      }
    }, 600);
  }

  input(field1: string, field2: string, event: any) {
    const { target: { value } } = event;

    clearTimeout(this.timeout);

    this.timeout = setTimeout(async () => {
      const result: any = await this.service.post({ field1, field2, value: value || 0 }, "settings");

      this.toast(result.updated);

      if(result.updated) {
        this.settings[field1][field2] = value || 0;
      }
    }, 600);
  }


  async toast(s: boolean) { // is success true/false
    const toast = await this.toastCtrl.create({
      message: s ? "Successfuly updated." : "Something went wrong. Try again later",
      duration: 1000,
      color: "green",
      mode: "ios",
    });

    toast.present();
  }

  async ngOnInit() {
    this.settings = await this.service.get("settings");

    console.log(this.settings);
  }

}
