import { ThisReceiver } from '@angular/compiler';
import { Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/services/main.service';
import { getImage } from 'src/functions';
import { UserInvitation } from 'src/models/user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.page.html',
  styleUrls: ['./user-info.page.scss'],
})
export class UserInfoPage implements OnInit {


  avatar: string;

  restaurants: any[] = [];
  works: any[] = [];
  invitations: UserInvitation[] = [];

  role: "manager" | "waiter" | "cook" = null!;


  ui = {
    title: "Ctraba",
    showRestaurants: false,
    showJobs: false,
    showAdd: false,
    showInvitations: false,
    registrationParagraphs: {
      email: "Add email address",
      avatar: "Add avatar image",
      // food: "What food do you like?"
    },
    showRegistration: false,
  };

  constructor(
    private service: UserService, 
    private main: MainService,
    private router: RouterService,
    private loader: LoadService,
  ) {
  }

  objectKeys = Object.keys;
  registration(type: string) {
    if(type == "continue") {
      if(!this.main.userInfo.email) {
        this.router.go(["user/email"], { replaceUrl: true });
      } else if(!this.main.userInfo.avatar) {
        this.router.go(["user/avatar/2"], { replaceUrl: true });
      }
    } else if(type == "email") {
      this.router.go(["user/email"], { replaceUrl: true });
    } else if(type == "avatar") {
      this.router.go(["user/avatar/2"], { replaceUrl: true });
    }
  }
  map() {
    this.router.go(["customer", "map"]);
  }
  goWork(restaurantId: string) {
    this.router.go(["staff", restaurantId, "dashboard"], { replaceUrl: true });
  }
  addRestaurant() {
    this.router.go(["add-restaurant/start"], { replaceUrl: true });
  }
  async invitation(id: string, type: "accept" | "reject", restaurant?: string) {
    let result = null;
    if(type == "accept") {
      result = await this.service
        .patch<{ success: boolean}>({}, "invitation/accept", this.main.userInfo._id, id);
    } else {
      result = await this.service
        .patch({}, "invitation/reject", restaurant, this.main.userInfo._id, id);
    }
    if(result.success) {
      for(let i in this.invitations) {
        if(this.invitations[i]._id == id) {
          this.invitations.splice(+i, 1);
          break;
        }
      }
      for(let i in this.main.userInfo.invitations) {
        if(this.main.userInfo.invitations[i]._id == id) {
          this.main.userInfo.invitations.splice(+i, 1);
          break;
        }
      }
      if(this.invitations.length == 0) {
        this.ui.showInvitations = false;
      }
    }
    if(result.job) {
      this.main.userInfo.works.push(result.job);
      this.works.push(result.job);
      this.ui.showJobs = true;
    }
    if(result.restaurant) {
      this.main.userInfo.restaurants.push(result.restaurant);
      this.restaurants.push(result.restaurant);
      this.ui.showRestaurants = true;
    }
  }
  async getUser() {

    const { ui, restaurants, works } = await this.service.get("userInfo");

    console.log(ui);

    this.restaurants = restaurants;
    this.works = works;

    this.ui = ui;
  }
  findJob() {
    this.router.go(["jobs"], { queryParams: { role: this.role }, queryParamsHandling: "merge", replaceUrl: true });
  }
  async ngOnInit() {
    await this.loader.start();
    this.router.go([], { queryParams: { last: null } }, false);
    await this.getUser();
    this.loader.end();
  }
}
