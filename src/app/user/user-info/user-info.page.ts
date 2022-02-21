import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/main.service';
import { payments } from 'src/assets/consts';
import { Restaurant } from 'src/models/user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.page.html',
  styleUrls: ['./user-info.page.scss'],
})
export class UserInfoPage implements OnInit {

  isAdd = false;

  restaurants: Restaurant[] = [];
  invitations: {name: string, id: string}[] = [];
  works = [];


  ui = {
    show: false,
    addRestaurantMessage: "",
    showSettings: false
  }

  types = payments;

  constructor(
    private service: UserService, 
    private main: MainService
  ) { }


  goWork(where: string) {
    this.service.go({ restaurant: where }, "staff-login");
  }
  settings() {
    this.service.go({}, "user-settings");
  }
  addRestaurant() {
    this.service.go({}, "add-restaurant");
  }
  goRestaurant(restaurant: string) {
    this.service.go({ restaurant }, "radmin");
  }
  async accept(restaurant: string, answer: boolean) {
    for(let i in this.invitations) {
      if(this.invitations[i].id == restaurant) {
        this.invitations.splice(+i, 1);
        break;
      }
    }
    for(let i in this.main.userInfo.invitations) {
      if(this.main.userInfo.invitations[i] === restaurant) {
        this.main.userInfo.invitations.splice(+i, 1);
        break;
      }
    }
    await this.service.accept(restaurant, answer, {username: this.main.userInfo.username, _id: this.main.userInfo._id});
    if(answer) {
      this.works.push({name: (await this.service.restaurantName(restaurant)).name, _id: restaurant })
    }
  }
  async getRestaurants() {
    this.restaurants = await this.service.getRestaurants(this.main.userInfo._id);
  }
  async getInvitations() {
    for(let i of this.main.userInfo.invitations) {
      this.invitations.push({name:(await this.service.restaurantName(i)).name, id: i});
    }
  }
  async getWorks() {
    for(let i of this.main.userInfo.works) {
      this.works.push({name: (await this.service.restaurantName(i)).name, _id: i });
    }
  }
  async ngOnInit() {
    this.ui.show = true;
    this.getRestaurants();
    this.getInvitations()
    this.getWorks();
  }

}
