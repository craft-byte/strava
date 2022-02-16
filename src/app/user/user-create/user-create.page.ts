import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/main.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.page.html',
  styleUrls: ['./user-create.page.scss'],
})
export class UserCreatePage implements OnInit {

  email = "";
  password = "";
  username = "";

  ui = {
    message: "",
    goRadmin: false
  }

  constructor(
    private service: UserService,
    private main: MainService
  ) { }


  async signup() {
    const { email, password, username } = this;
    if(
      email.length == 0 ||
      password.length == 0 ||
      username.length == 0
    ) {
      this.ui.message = "Something Went Wrong"
      return;
    }
    const result = await this.service.createAccount({ email: this.email, password: this.password, username: this.username });
    if(result.acknowledged) {
      this.main.userInfo = result.user;
      this.service.go({}, "user-info");
    }
  }

  ngOnInit() {
  }

}
