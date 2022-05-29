import { Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

  role: string;


  restaurants: any[] = [];
  works: any[] = [];
  invitations: UserInvitation[] = [];


  ui = {
    name: "",
    username: "",
    email: "",
    addRestaurant: false,
    showRestaurants: false,
    showJobs: false,
    showFindJob: false,
    showInvitations: false,
  };

  constructor(
    private service: UserService, 
    private main: MainService,
    private router: Router
  ) {
  }


  goWork(restaurantId: string) {
    this.router.navigate(["staff", restaurantId, "dashboard"], { replaceUrl: true });
  }
  addRestaurant() {
    this.router.navigate(["add-restaurant"], { replaceUrl: true });
  }
  goRestaurant(restaurant: string) {
    this.router.navigate(["restaurant", restaurant], { replaceUrl: true });
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
  setRole(r: string) {
    this.role = r;
  }
  async getUser() {
    const {
      username,
      name,
      email,
      avatar,
      restaurants,
      works,
      invitations
    } = this.main.userInfo;


    let showRestaurants = false;
    let showAddRestaurant = false;
    let showJobs = true;
    let showInvitations = false;
    let showFindJobs = false;
    
    
    if(name) {
      this.ui.name = name;
      this.ui.username = username;
    } else {
      this.ui.name = username;
      this.ui.email = email;
    }

    this.avatar = getImage(avatar);
    if(!this.avatar) {
      this.avatar = "./../../../assets/images/plain-avatar.jpg";
    }


    if(restaurants.length > 0) {
      this.restaurants = await this.service.get("restaurants");
      showRestaurants = true;
    } else {
      showAddRestaurant = true;
    }
    if(works.length > 0) {
      this.works = await this.service.get("works");
      showAddRestaurant = false;
    } else {
      showJobs = false;
      showFindJobs = showRestaurants ? false : true;
    }

    if(invitations.length > 0) {
      this.invitations = await this.service.get('invitations');
      showInvitations = true;
    }

    this.ui.showJobs = showJobs;
    this.ui.showFindJob = showFindJobs;
    this.ui.showRestaurants = showRestaurants;
    this.ui.addRestaurant = showAddRestaurant;
    this.ui.showInvitations = showInvitations;
  }
  findJob() {
    this.router.navigate(["jobs"], { queryParams: { role: this.role }, queryParamsHandling: "merge", replaceUrl: true });
  }
  async ngOnInit() {
    this.getUser();
  }
}
