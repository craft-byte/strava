import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from 'src/app/restaurant/services/restaurant.service';
import { getImage } from 'src/functions';
import { FirePage } from './fire/fire.page';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  userId: string;
  userAvatar: string;

  user: any;
  settings: any;
  role: string;

  ui = {
    showFire: false,
  }

  constructor(
    private loader: LoadService,
    private router: RouterService,
    private route: ActivatedRoute,
    private service: RestaurantService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
  ) { };

  back() {
    this.router.go(["restaurant", this.service.restaurantId, "people", "worker", this.userId]);
  }

  async setRole(role: string) {
    const alert = await this.alertCtrl.create({
      mode: "ios",
      header: "Please, be certain",
      subHeader: "Are you sure you want to change the worker's role?",
      buttons: [
        {
          text: "Cancel",
          role: "cancel"
        },
        {
          text: "Submit",
          role: "submit"
        }
      ]
    });

    await alert.present();


    const { role: r } = await alert.onDidDismiss();

    let lastRole: string;

    if (r == "submit") {
      lastRole = this.role;
      this.role = role;
      await this.loader.start();
      try {
        const update: any = await this.service.post({ role }, "staff", this.userId, "role");
  
        if(update.updated) {
          this.settings = update.settings;
        } else {
          this.role = lastRole;
        }
      } catch (e) {
        if(e.status == 422) {
          this.role = lastRole;
          (await this.toastCtrl.create({
            duration: 1500,
            color: 'red',
            mode: "ios",
            message: "Something went wrong changing role",
          })).present();
        }
      }

      this.loader.end();
    }
  }


  async set(field: string, e: any) {
    const { target: { checked } } = e;


    this.settings[field] = checked;

    const update: any = await this.service.post({ field, value: checked }, "staff", this.userId, "settings");

    try {
      if (!update.updated) {
        this.settings[field] = !checked;
        (await this.toastCtrl.create({
          duration: 1500,
          color: 'red',
          mode: "ios",
          message: "Something went wrong changing " + field,
        })).present();
      }
    } catch (e) {
      if (e.status == 422) {
        (await this.toastCtrl.create({
          duration: 1500,
          color: 'red',
          mode: "ios",
          message: "Something went wrong changing " + field,
        })).present();
      }
    }
  }

  async fire() {
    const alert = await this.alertCtrl.create({
      header: "Please, be certain.",
      subHeader: "Are you sure you want to fire the worker?",
      mode: "ios",
      buttons: [
        {
          text: "Cancel"
        },
        {
          text: "Submit",
          cssClass: "alert-red-button",
          role: "fire",
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();

    if(role != "fire") {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: FirePage,
      mode: "ios",
      componentProps: {
        username: this.user.name,
      }
    });

    await modal.present();

    const { data, role: r } = await modal.onDidDismiss();

    if(r == "submit") {
      console.log(data);
      
    }
  }

  async setWork(field: string, e: any) {
    const { target: { checked } } = e;

    try {
      const update: any = await this.service.post({ field, value: checked }, "staff", this.userId, "settings", "work");

      if (!update.updated) {
        this.settings.work[field] = !checked;
        (await this.toastCtrl.create({
          duration: 1500,
          color: 'red',
          mode: "ios",
          message: "Something went wrong changing " + field,
        })).present();
      }
    } catch (e) {
      if (e.status == 422) {
        (await this.toastCtrl.create({
          duration: 1500,
          color: 'red',
          mode: "ios",
          message: "Something went wrong changing " + field,
        })).present();
      }
    }
  }

  async ngOnInit() {
    await this.loader.start();

    this.userId = this.route.snapshot.paramMap.get("userId");

    try {
      const result: any = await this.service.get({}, "staff", this.userId, "settings");

      const { user, settings, role, showFire } = result;

      this.ui.showFire = showFire;

      this.user = user;
      this.role = role;
      this.settings = settings;
      this.userAvatar = getImage(user.avatar);

      console.log(result);
    } catch (e) {
      if (e.status == 404) {
        if (e.body.reason == "deleted") {
          (await this.toastCtrl.create({
            duration: 2000,
            message: "You can't change deleted user's settings",
            color: "red",
            mode: "ios",
          })).present();
          this.back();
        } else if (e.body.reason == "staff") {
          (await this.toastCtrl.create({
            duration: 2000,
            message: "This user is not member of the restaurant's staff",
            color: "red",
            mode: "ios",
          })).present();
          this.router.go(["restaurant", this.service.restaurantId, "people", "staff"]);
        }
      }
      return;
    }




    this.loader.end();
  }

}
