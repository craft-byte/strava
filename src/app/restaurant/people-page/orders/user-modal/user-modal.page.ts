import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { RestaurantService } from 'src/app/restaurant/services/restaurant.service';
import { getImage } from 'src/functions';

@Component({
  selector: 'app-user-modal',
  templateUrl: './user-modal.page.html',
  styleUrls: ['./user-modal.page.scss'],
})
export class UserModalPage implements OnInit {

  user: { name: string; username: string; avatar: any; };
  favorite: { name: string; };
  total: number;
  blacklisted: boolean;
  image: string;

  disableButton = false;

  constructor(
    private service: RestaurantService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) { }

  @Input() userId: string;

  close() {
    this.modalCtrl.dismiss();
  }

  async unBlacklist() {
    this.disableButton = true;
    const result: any = await this.service.delete("people/unblacklist", this.userId);

    if(result.done) {
      this.blacklisted = false;
      this.disableButton = false;
      this.modalCtrl.dismiss(true);
      (await this.toastCtrl.create({
        duration: 3000,
        message: "Successfuly removed from blacklist",
        mode: "ios",
        color: "green"
      })).present();
    } else {
      (await this.toastCtrl.create({
        duration: 3000,
        message: "Something went wrong. Try again later.",
        color: "red",
        mode: "ios",
      })).present();
    }
  }
  async blacklist() {
    this.disableButton = true;
    const result: any = await this.service.delete("people/blacklist", this.userId);

    if(result.done) {
      this.blacklisted = true;
      this.disableButton = false;
      this.modalCtrl.dismiss(true);
      (await this.toastCtrl.create({
        duration: 3000,
        color: "green",
        message: "User is in blacklist",
        mode: "ios",
      })).present();
    } else {
      (await this.toastCtrl.create({
        duration: 3000,
        message: "Something went wrong. Try again later.",
        color: "green",
        mode: "ios",
      })).present();
    }
  }

  async ngOnInit() {
    const result: any = await this.service.get("people", "user", this.userId);

    if(!result) {
      return this.modalCtrl.dismiss();
    }

    this.user = result.user;
    this.favorite = result.favorite;
    this.total = result.total / 100;
    this.blacklisted = result.blacklisted;

    this.image = getImage(this.user.avatar) || "./../../../../../assets/images/plain-avatar.jpg";

    console.log(result);
  }

}
