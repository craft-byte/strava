import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';
import { User } from 'src/models/user';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-change-modal',
  templateUrl: './change-modal.page.html',
  styleUrls: ['./change-modal.page.scss'],
})
export class ChangeModalPage implements OnInit {

  ui = {
    title: "",
    color: "warning",
    name: {
      1: "Other users will see this name when you leave a feedback for restaurant.",
      2: "You can change it whenever you want."
    },
    username: {
      1: "Username is used to search for users. Username is used instead of account name if one is not provided.",
      2: "Only A-Z a-z 0-9 and underscore are allowed.",
      3: "You can change it once a week."
    },
    usernameInput: "",
    disableSend: false
  };

  timeout: any;

  t: "name" | "username" | "email";
  user: User;

  email: string;
  code: string;
  username: string;
  name: string;

  constructor(
    private modalCtrl: ModalController,
    private main: MainService,
    private service: UserService,
    private toastCtrl: ToastController
  ) { };

  @Input() type: number;

  close() {
    this.modalCtrl.dismiss();
  }

  async send() {
    const result = await this.service.post<{ error: "none" }>({ email: this.email }, "email/setEmail")

    if(result.error == "none") {
      this.ui.disableSend = true;
    } else {
      this.modalCtrl.dismiss();
      (await this.toastCtrl.create({
        duration: 6000,
        message: "Something went wrong. Try again later.",
        mode: "ios",
        color: "red",
      })).present();
    }
  }
  async verify() {
    const result = await this.service.post<{ error: "none" }>({ code: this.code }, "email/verify");

    if(result.error = "none") {
      this.user.email = this.email;
      this.modalCtrl.dismiss();
      (await this.toastCtrl.create({
        duration: 6000,
        message: "Your email address was successfuly changed.",
        mode: "ios",
        color: "success"
      })).present()
    };
  }

  checkUsername(event: any) {
    const { target: { value } } = event;

    clearTimeout(this.timeout);

    if(this.user.username == value) {
      this.ui.usernameInput = "";
      return;
    };

    this.timeout = setTimeout(async () => {
      const allowed = await this.service.post({ username: value }, "username/check");
      if(allowed) {
        this.ui.usernameInput = "green";
        this.username = value;
      } else {
        this.ui.usernameInput = "red";
      }
    }, 600);
  }

  async submit() {
    const result =await this.service.post<{ error: "none" }>({ field: this.t, value: this[this.t] }, "update")

    this.modalCtrl.dismiss();

    if(result) {
      this.user[this.t] = this[this.t];
      (await this.toastCtrl.create({
        duration: 6000,
        message: "Updated successfuly.",
        color: "green"
      }));
    } else {
      (await this.toastCtrl.create({
        duration: 6000,
        message: "Something went wrong. Try again later.",
        color: "red"
      }));
    }
  }

  ngOnInit() {
    this.user = this.main.userInfo;
    this.email = this.user.email;
    this.username = this.user.username;
    this.name = this.user.name;
    switch (this.type) {
      case 1:
        this.ui.title = "Change name";
        this.t = "name";
        break;
      case 2:
        this.ui.title = "Change username",
        this.ui.color = "purple"
        this.t = "username";
        break;
      case 3:
        this.ui.title = "Change email"
        this.ui.color = "red"
        this.t = "email";
        break;
    }
  }

}
