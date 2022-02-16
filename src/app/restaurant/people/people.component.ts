import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Restaurant } from 'src/models/radmin';
import { RadminService } from '../radmin.service';

@Component({
  selector: 'app-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.scss'],
})
export class PeopleComponent implements OnInit {

  page: "staff" | "customers" | "settings" = "staff";
  restaurant: Restaurant;

  constructor(
    private router: Router,
    // private route: ActivatedRoute,
    private service: RadminService
  ) { }

  go(p: "staff" | "customers" | "settings") {
    this.page = p;
    this.router.navigate(["radmin/people", p], { queryParamsHandling: "preserve" });
  }

  pageInit() {
    this.page = this.router.url
      .split("/")[this.router.url.split("/").length - 1]
      .split("?")[0] as "staff" | "customers" | "settings";
  }

  async ngOnInit() {
    this.restaurant = await this.service.getRestaurant();
    this.pageInit();
  }

}
