import { ThisReceiver } from '@angular/compiler';
import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
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
  avatar: string;

  ui = {
    changeTitle: "Change"
  }

  constructor(
    private service: UserService,
    private modalCtrl: ModalController,
    private router: Router,
    private main: MainService,
  ) { };



  exit() {
    this.router.navigate(["user/account"], { replaceUrl: true, queryParamsHandling: "preserve" });
  }

  changeAvatar() {
    this.router.navigate(["user/avatar/2"], { replaceUrl: true, queryParams: { last: this.router.url } });
  }

  async change(n: number) {
    if(n == 1) {
      this.router.navigate(["user/name/2"], { replaceUrl: true, queryParams: { last: this.router.url } });
    } else if(n == 2) {
      this.router.navigate(["user/username"], { replaceUrl: true, queryParams: { last: this.router.url } });
    } else if(n == 3) {
      this.router.navigate(["user/email"], { replaceUrl: true, queryParams: { last: this.router.url } });
    }
  }

  async ngOnInit() {
    this.user = this.main.userInfo;
    const { avatar } = await this.service.get("avatar") as any;
    this.avatar = getImage(avatar) || "./../../../assets/images/plain-avatar.jpg";
  }

}
