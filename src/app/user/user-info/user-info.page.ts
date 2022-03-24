import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/main.service';
import { payments } from 'src/assets/consts';
import { Restaurant } from 'src/models/radmin';
import { UserInvitation } from 'src/models/user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.page.html',
  styleUrls: ['./user-info.page.scss'],
})
export class UserInfoPage implements OnInit {

  isAdd = false;

  restaurants: Restaurant[] = [];
  invitations: UserInvitation[] = [];
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
    }
  }
  async getRestaurants() {
    this.restaurants = await this.service.getRestaurants(this.main.userInfo._id);
  }
  async getInvitations() {
    this.invitations = await this.service.get("invitations/get", this.main.userInfo._id);
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
