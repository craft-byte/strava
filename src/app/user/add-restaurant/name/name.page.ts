import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-name',
  templateUrl: './name.page.html',
  styleUrls: ['./name.page.scss'],
})
export class NamePage implements OnInit {

  name: string;

  ui = {
    redMessage: "",
    message: "Name for your restaurant. This name people will see on the map and when searching."
  }

  constructor(
    private service: UserService,
    private router: Router,
    private toastCtrl: ToastController,
  ) { };

  exit() {
    this.router.navigate(["user/info"], { replaceUrl: true });
  }

  async add() {
    if(!this.name || this.name.length < 4) {
      return this.ui.redMessage = "Your name can't be less than 4 characters";
    }

    const result: any = await this.service.post({ name: this.name }, "add-restaurant/name");

    if(result.added) {
      this.router.navigate(["add-restaurant/theme", result.insertedId], { replaceUrl: true });
    } else {
      this.router.navigate(["user/info"], { replaceUrl: true });
      (await this.toastCtrl.create({
        duration: 3000,
        message: "Sorry, something went wrong. Please, try again.",
        color: "red",
        mode: "ios",
      })).present();
    }
  }

  ngOnInit() {
  }

}
