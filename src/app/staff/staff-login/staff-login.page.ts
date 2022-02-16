import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MainService } from 'src/app/main.service';
import { Connection } from 'src/models/staff';
import { StaffService } from '../staff.service';

@Component({
  selector: 'app-staff-login',
  templateUrl: './staff-login.page.html',
  styleUrls: ['./staff-login.page.scss'],
})
export class StaffLoginPage implements OnInit {


  restaurant: string;
  restaurants: { name: string; _id: string; sname: string; }[] = [];

  settings: { withNoAccount: boolean };

  sname: string;
  password: string;

  subscription: Subscription;

  ui = {
    loginMessage: "",
    username: null
  };

  form = false;


  constructor(
    private service: StaffService,
    private main: MainService,
    private ar: ActivatedRoute
  ) { };

  async login() {
    const subscription = this.service.login2(this.sname, this.password).subscribe(res => {
      const { type } = res;

      switch (type) {
        case "connection/error":
          const { error } = res.data as Connection.ConnectionError
          switch (error) {
            case "password":
              // DO SOMETHINH
              break;
            case "restaurant":
              // DO SOMETHINH
              break;
            default:
              subscription.unsubscribe();
          }
          break;
        case "connection/success":
          this.form = false;
          const { restaurant, sname } = res.data as Connection.Init;
          this.restaurant = restaurant;
          this.service.restaurant = restaurant;
          this.service.sname = sname;
          break;
        default:
          subscription.unsubscribe();
      }
    });
  }
  async loginAccount(restaurant: string) {
    if(this.main.userInfo) {
      this.subscription = this.service.login({ user: this.main.userInfo._id, restaurant }).subscribe(res => {
        const { type } = res;

        if(type == "connection/error") {
          const { error } = res.data as Connection.ConnectionError;
          if(error == "restaurant") {
            this.ui.loginMessage = "No Restaurant Found!";
          } else if(error == "user") {
            this.ui.loginMessage = "User isn't Whitelisted!";
          }
          this.restaurant = null;
          return;
        } else if(type == "connection/success") {
          const { restaurant, sname, username } = res.data as Connection.Init;
          this.service.restaurant = restaurant;
          this.restaurant = restaurant;
          this.service.sname = sname;
          this.service.username = username;
        }
      });
      return;
    }
  }
  async back() {
    if(this.restaurant && this.main.userInfo && await this.main.isOwner(this.restaurant)) {
      this.service.go({ restaurant: this.restaurant }, "radmin");
    } else if(this.main.userInfo) {
      this.service.go({}, "user-info");
    } else {
      this.service.go({}, "login");
    }
  }
  setRestaurant(id: string) {
    this.loginAccount(id);
  }
  loginToAccount() {
    this.main.login(true, { url: "staff-login" });
  }
  async getRestaurants() {
    this.restaurants = await this.service.get(["names"], [], {ids: this.main.userInfo.works});
  }
  async ngOnInit() {
    const restaurantId = this.ar.snapshot.queryParamMap.get("restaurant");
    if(!await this.main.login(false)) {
      if(restaurantId) {
        const restaurant = (await this.service.getSettings(restaurantId));
        if(!restaurant || !restaurant.settings || restaurant.settings.hasOwnProperty("error")) {
          console.log("error");
          return;
        }
        if(!restaurant.settings.withNoAccount) {
          await this.main.login(true, { url: "staff-login", queryParams: { restaurant: restaurantId } });
          return;
        }
        try {
          this.sname = (await this.service.get(["names"], [], {ids: [restaurantId]}))[0].sname; 
        } catch (error) {
          console.log(error);
          this.sname = "error getting restaurant sname";
        }
        this.form = true;
      } else {
        this.form = true;
      }
      return;
    }
    if(restaurantId) {
      this.loginAccount(restaurantId);
    } else {
      this.getRestaurants();
    }
    this.restaurant = restaurantId;
  }
}
