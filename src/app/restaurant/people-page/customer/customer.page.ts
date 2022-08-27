import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { User } from 'src/models/user';
import { RestaurantService } from '../../services/restaurant.service';

interface Result {
  user: {
      name: string;
      email: string;
      avatar: any;
      _id: string;
  };
  orders: {
      dishes: number;
      total: number;
      date: string;
      status: string;
      _id: string;
  }[];
  info: {
      total: number;
      orders: number;
      lastVisit: string;
      blacklisted: boolean;
  }
};

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
})
export class CustomerPage implements OnInit {

  orders: Result["orders"];
  user: Result["user"];
  info: Result["info"];
  userAvatar: string;

  constructor(
    private service: RestaurantService,
    private router: RouterService,
    private route: ActivatedRoute,
    private loader: LoadService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) { };

  fullOrder(id: string) {
    this.router.go(["restaurant", this.service.restaurantId, "people", "order", id], { queryParams: { last: this.router.url } });
  }

  async addToBlacklist() {
    const alert = await this.alertCtrl.create({
      header: "Please, be certain",
      subHeader: "Are you sure you want to add the customer to blacklist",
      mode: "ios",
      buttons: [
        {
          text: "Cancel",
        },
        {
          text: "Submit",
          role: "submit",
          cssClass: "alert-red-button"
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();


    if(role == "submit") {
      try {
        const result: any = await this.service.delete("customers", "blacklist", this.user._id);
        if(result.updated) {
          this.info.blacklisted = true;
        } else {
          (await this.toastCtrl.create({
            duration: 2000,
            color: "red",
            message: "Something went wrong. Please try again.",
            mode: "ios",
          })).present();
        }
      } catch (e) {

      }
    }

  }
  async removeFromBlacklist() {
    const alert = await this.alertCtrl.create({
      header: "Please, be certain",
      subHeader: "Are you sure you want to remove the customer from blacklist",
      mode: "ios",
      buttons: [
        {
          text: "Cancel",
        },
        {
          text: "Submit",
          role: "submit",
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();


    if(role == "submit") {
      try {
        const result: any = await this.service.delete("customers", "unblacklist", this.user._id);
        if(result.updated) {
          this.info.blacklisted = false;
        } else {
          (await this.toastCtrl.create({
            duration: 2000,
            color: "red",
            message: "Something went wrong. Please try again.",
            mode: "ios",
          })).present();
        }
      } catch (e) {

      }
    }
  }

  back() {
    const last = this.route.snapshot.queryParamMap.get("last");
    if(last) {
      this.router.go([last]);
    } else {
      this.router.go(["restaurant", this.service.restaurantId, "people", "customers"]);
    }
  }

  async ngOnInit() {
    await this.loader.start();
    const userId = this.route.snapshot.paramMap.get("userId");

    const result: Result = await this.service.get({}, "customers", userId);

    console.log(result);


    if(!result) {
      return this.router.go(["restaurant", this.service.restaurantId, "people", "customers"], { replaceUrl: true });
    }

    const { orders, user, info } = result;

    this.orders = orders;
    this.user = user;
    this.info = info;


    this.userAvatar = getImage(this.user.avatar) || "./../../../assets/images/plain-avatar.jpg";

    this.loader.end();
  }

}
