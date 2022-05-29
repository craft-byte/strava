import { StringMapWithRename } from '@angular/compiler/src/compiler_facade_interface';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { ManagerSettings } from 'src/models/components';
import { RestaurantService } from '../../services/restaurant.service';
import { ModalPage } from './more-modal/modal.page';

interface User {
  name: string;
  username: string;
  avatar: any;
  _id: string;
  email: string;
}
interface Worker {
  settings: ManagerSettings,
  role: string;
  joined: string;
}

@Component({
  selector: 'app-full',
  templateUrl: './full.page.html',
  styleUrls: ['./full.page.scss'],
})
export class FullPage implements OnInit {

  user: User;
  worker: Worker;
  restaurant: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: RestaurantService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) { };

  back() {
    this.router.navigate(["restaurant", this.service.restaurantId, "people", "staff"], { replaceUrl: true });
  }

  async more() {
    const modal = await this.modalCtrl.create({
      component: ModalPage,
      mode: "ios",
      cssClass: "modal-width",
      id: "more",
      swipeToClose: true,
      componentProps: {
        name: this.user.name || this.user.username,
        userId: this.user._id,
      }
    });


    await modal.present();

  }

  async ngOnInit() {
    const userId = this.route.snapshot.paramMap.get("userId");
    const result: any = await this.service.get("staff", userId);
    this.restaurant = this.service.restaurant;

    if(!result) {
      (await this.toastCtrl.create({
        duration: 4000,
        color: "red",
        message: "Something is wrong.",
        mode: "ios",
      })).present();
      return this.back();
    }

    const { user, worker } = result;


    this.user = user;
    this.worker = worker;
  }

}
