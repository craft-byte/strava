import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/main.service';
import { User } from 'src/models/user';
import { UserService } from '../user.service';

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

  set = {
    username: "",
    name: "",
    phone: ""
  }

  constructor(
    private service: UserService,
    private main: MainService
  ) { };


  back() {
    this.service.go({}, "user-info");
  }
  logout() {
    this.main.logout();
    this.service.go({}, "login");
    this.main.last = null;
  }
  danger(type: "remove" | "password") {
    this.service.go({}, "danger", type);
  }
  async update() {
    const result = await this.service
      .update({ username: this.set.username, phone: this.set.phone, name: this.set.name }, this.user._id);
    if(result.acknowledged) {
      this.ui.changeTitle = "Changed";
      this.main.userInfo.phone = this.set.phone;
    } else {
      this.ui.changeTitle = "Something went wrong";
      console.log(result.error);
    }
  }

  async ngOnInit() {
    await this.main.login(true, { url: "settings" });
    this.user = this.main.userInfo;
    this.set.username = this.user.username;
    this.set.name = this.user.name;
  }

}
