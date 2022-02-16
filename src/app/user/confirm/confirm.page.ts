import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/main.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.page.html',
  styleUrls: ['./confirm.page.scss'],
})
export class ConfirmPage implements OnInit {

  password: string = "";
  restaurant: string = "";
  username: string = "";

  type: "remove" | "restaurant";

  ui = {
    warning: "",
    restaurant: "",
    title: ""
  }

  constructor(
    private main: MainService,
    private service: UserService
  ) { }

  back() {
    this.service.go({}, "restaurant-settings");
  }

  async confirm() {
    if(this.type === "restaurant") {
      if(this.restaurant.length === 0 || this.password.length === 0) {
        this.ui.title = "Something went wrong!";
        return;
      }
      const { removed, id } = await this.service.confirm(this.type, { restaurant: this.restaurant, password: this.password, user: this.main.userInfo._id});
      if(removed) {
        for(let i in this.main.userInfo.works) {
          if(id === this.main.userInfo.works[i]) {
            this.main.userInfo.works.splice(+i, 1);
            break;
          }
        }
        for(let i in this.main.userInfo.restaurants) {
          if(id === this.main.userInfo.restaurants[i]) {
            this.main.userInfo.restaurants.splice(+i, 1);
            break;
          }
        }
        this.service.go({}, 'user-info');
      } else {
        this.ui.title = "Something went wrong!";
        this.password = "";
        this.restaurant = "";
      }
    }
  }

  ngOnInit() {
    if(!this.main.userInfo) {
      this.main.login(true);
    }
    if(!this.main.confirmType) {
      this.back();
    }
    this.type = this.main.confirmType;
    this.ui.restaurant = this.main.type;

    switch (this.type) {
      case "restaurant":
        this.ui.warning = "This action cannot be undone. This will permanently delete the " + this.ui.restaurant + " restaurant, dishes, and remove all statistics data.";
        break;
      default:
        this.ui.warning = "This action cannot be undone. This will permanently delete the account.";
        break;
    }
  }

}
