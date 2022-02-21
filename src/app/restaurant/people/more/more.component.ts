import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getImage } from 'src/functions';
import { Restaurant, Worker } from 'src/models/radmin';
import { User } from 'src/models/user';
import { RadminService } from '../../radmin.service';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.scss'],
})
export class MoreComponent implements OnInit {

  user: User;
  worker: Worker;
  name: string;
  role: string;
  joined: string;
  image: string;

  restaurant: Restaurant;
  settingsWindow = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RadminService
  ) { };

  back() {
    this.router.navigate(["radmin/people/staff"], { queryParamsHandling: "preserve" });
  }

  goSettings() {
    this.settingsWindow = true;
  }

  onSettingsWindowEmit({ type }: { type: string }) {
    this.settingsWindow = false;
    if(type == "") {
      
    }
  }

  getDate(date: Date) {
    const d = new Date(date);
    const month = monthNames[d.getMonth()];

    this.joined = `${d.getDate()} ${month}`;
  }

  async ngOnInit() {
    const user = this.route.snapshot.paramMap.get("id");
    const restaurant = this.route.snapshot.queryParamMap.get("restaurant");
    const { worker, user: u } = await this.service.get("user/work", restaurant, user);
    this.user = u;
    this.worker = worker;
    this.name = this.user.name || this.user.username;
    this.image = await getImage(this.user.avatar) || "./../../../../assets/images/plain-avatar.jpg";
    this.getDate(this.worker.joined);
    this.restaurant = await this.service.getRestaurant();

    console.log(worker.settings);


    switch (this.worker.role) {
      case "admin":
        this.role = "Admin";
        break;
      case "cook":
        this.role = "Cook";
        break;
      case "waiter":
        this.role = "waiter";
        break;
      case "manager":
        this.role = "Manager";
        break;
    }

  }

}
