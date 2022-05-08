import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.page.html',
  styleUrls: ['./user-create.page.scss'],
})
export class UserCreatePage implements OnInit {

  password = "";
  username = "";

  ui = {
    message: "",
    goRadmin: false
  }

  constructor(
    private service: UserService,
    private main: MainService,
    private modalCtrl: ModalController,
    private router: Router
  ) { }


  async signup() {
    const { password, username } = this;
    if(
      password.length == 0 ||
      username.length == 0
    ) {
      this.ui.message = "Fill all the fields.";
      return;
    }
    const result = await this.service.createAccount({ password: this.password, username: this.username });
    if(result.acknowledged) {
      this.main.userInfo = result.user;
      this.router.navigate(["email-setup"], { queryParamsHandling: "preserve", replaceUrl: true });
    }
  }

  ngOnInit() {
  }

}
