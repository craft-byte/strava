import { ThisReceiver } from '@angular/compiler';
import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/services/main.service';
import { getImage } from 'src/functions';
import { User } from 'src/models/user';
import { UserService } from '../user.service';
import { ChangeModalPage } from './change-modal/change-modal.page';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  user: User;
  avatar: string = "./../../../assets/images/plain-avatar.jpg";

  ui = {
    changeTitle: "Change"
  }

  constructor(
    private service: UserService,
    private alertCtrl: AlertController,
    private router: RouterService,
    private main: MainService,
    private loader: LoadService,
  ) { };


  async remove() {
    const alert = await this.alertCtrl.create({
      header: "Please, be certain.",
      subHeader: "Are you sure you want to delete the account and all the data connected to it?",
      mode: "ios",
      buttons: [
        {
          role: "cancel",
          text: "Cancel",
        },
        {
          role: "remove",
          text: "Submit",
          cssClass: "alert-red-button"
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();

    if(role == "remove") {
      const result: any = await this.service.delete("");

      this.router.go(["user/creat3e"]);
    }
  }

  exit() {
    this.router.go(["user/account"], { replaceUrl: true, queryParamsHandling: "preserve" });
  }

  changeAvatar() {
    this.router.go(["user/avatar/2"], { replaceUrl: true, queryParams: { last: this.router.url } });
  }

  async change(n: number) {
    if(n == 1) {
      this.router.go(["user/name/2"], { replaceUrl: true, queryParams: { last: this.router.url } });
    } else if(n == 2) {
      this.router.go(["user/username"], { replaceUrl: true, queryParams: { last: this.router.url } });
    } else if(n == 3) {
      this.router.go(["user/email"], { replaceUrl: true, queryParams: { last: this.router.url } });
    }
  }

  async ngOnInit() {
    this.user = this.main.userInfo;
    const { avatar } = await this.service.get("avatar") as any;
    this.avatar = getImage(avatar) || "./../../../assets/images/plain-avatar.jpg";
    this.loader.end();
  }

}
