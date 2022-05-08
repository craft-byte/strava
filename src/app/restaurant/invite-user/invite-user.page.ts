import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getImage } from 'src/functions';
import { Restaurant } from 'src/models/general';
import { RadminService } from '../radmin.service';

@Component({
  selector: 'app-invite-user',
  templateUrl: './invite-user.page.html',
  styleUrls: ['./invite-user.page.scss'],
})
export class InviteUserPage implements OnInit {

  restaurant: Restaurant;

  delay: any;
  user: any;

  username: string = "";

  ui = {
    showResults: false,
    showNotFound: false,
    showOther: true,
    showFeedbacks: false,
    showNoFeedbacks: false,
    title: "Ctraba",
    canFind: false,
    canLeave: false,
    inviteText: ""
  };

  constructor(
    private service: RadminService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  inputChange(ev: any) {
    const { target: { value } } = ev;

    this.username = value;

    if(value.length == 0) {
      this.ui.showOther = true;
      this.user = null;
      return;
    }

    clearTimeout(this.delay);
    this.delay = setTimeout(() => {
      this.findUsers();
    }, 1000);

  }

  async findUsers() {
    this.ui.showOther = false;
    this.user = await this.service.patch({ username: this.username }, "user");
    if(this.user) {
      this.user.avatar = await getImage(this.user.avatar) || "./../../../assets/images/plain-avatar.jpg";
      this.ui.showNotFound = false;
      this.ui.showResults = true;
      if(this.user.feedbacks) {
        this.ui.showFeedbacks = true;
        this.ui.showNoFeedbacks = this.user.feedbacks.length == 0;
      }
    } else {
      this.ui.showNotFound = true;
    }
  }

  close() {
    this.router.navigate(["restaurant", this.restaurant._id, "people", "staff"], { queryParamsHandling: "preserve" });
  }

  invite() {
    this.router.navigate([ "invite-user", this.restaurant._id, this.user._id ], { queryParamsHandling: "preserve" });
  }

  clear() {
    this.user = null;
    this.username = "";
  }

  async ngOnInit() {
    const restaurantId = this.route.snapshot.params.restaurantId;
    this.restaurant = await this.service.getRestaurant(restaurantId);
    this.ui.title = this.ui.inviteText = `Invite to ${this.restaurant.name}`;
  }
}