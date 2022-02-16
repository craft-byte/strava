import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User, Restaurant2 } from 'src/models/user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit {

  user: User;
  restaurant: Restaurant2 = null;

  hasNotBeenInvited = false;

  ui = {
    title: "Ctraba"
  }

  constructor(
    private ar: ActivatedRoute,
    private service: UserService
  ) { }

  back() {
    this.service.go({restaurant: this.restaurant._id}, "radmin");
  }
  invite() {
    this.service.invite(this.user._id, this.restaurant._id);
    this.hasNotBeenInvited = true;
  }
  goStaff() {
    this.service.go({ restaurant: this.restaurant._id}, "restaurant-workers");
  }

  async ngOnInit() {
    const id = this.ar.snapshot.paramMap.get("id");
    const restaurant = this.ar.snapshot.queryParamMap.get("restaurant");
    this.user = await this.service.getUserInfo(id);
    if(restaurant) {
      this.restaurant = (await this.service.getRestaurantName(restaurant));
    }
    if(this.restaurant) {
      for(let _id of this.restaurant.invitations) {
        if(_id == this.user._id) {
          this.hasNotBeenInvited = true;
          break;
        }
      }
    }
  }

}
