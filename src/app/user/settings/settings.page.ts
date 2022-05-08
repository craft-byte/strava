import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';
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

  ui = {
    changeTitle: "Change"
  }

  constructor(
    private service: UserService,
    private modalCtrl: ModalController,
    private router: Router,
    private main: MainService,
  ) { };


  logout() {
    this.main.logout();
    this.router.navigate(["login"], { replaceUrl: true, queryParamsHandling: "preserve" });
    this.main.last = null;
  }
  exit() {
    this.router.navigate(["user/info"], { replaceUrl: true, queryParamsHandling: "preserve" });
  }


  async change(n: number) {
    const modal = await this.modalCtrl.create({
      component: ChangeModalPage,
      mode: "ios",
      swipeToClose: true,
      componentProps: {
        type: n
      }
    });


    modal.present();
  }

  async ngOnInit() {
    console.log(this.main.userInfo);
    this.user = this.main.userInfo;
  }

}
