import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ManagerSettings } from 'src/models/components';
import { MainService } from '../../services/main.service';
import { RadminService } from '../radmin.service';

@Component({
  selector: 'app-radmin',
  templateUrl: './radmin.page.html',
  styleUrls: ['./radmin.page.scss'],
})
export class RadminPage implements OnInit, OnDestroy {

  restaurant: string;
  name: string;
  subs: Subscription;

  restaurants: { name: string; _id: string }[];

  ui = {
    disableDishes: true,
    disablePeople: true,
    disableCooking: true,
    disableSettings: true,
    showTutorials: false,
  }

  page = "";

  constructor(
    public main: MainService,
    private router: Router,
    private service: RadminService,
    private route: ActivatedRoute
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  };

  goOther(s: 1 | 2) {
    this.router.navigate([`${s === 1 ? "user/info" : "add-restaurant"}`], { replaceUrl: true });
  }

  async go(p: "home" | "people" | "cooking" | "dishes") {
    this.router.navigate([p], { relativeTo: this.route, queryParamsHandling: "preserve" });
  }


  choose(_id: string) {
    this.router.navigate(["restaurant", _id]);
  }


  async ngOnInit() {
    const restaurantId = this.route.snapshot.paramMap.get("restaurantId");
    const r = this.router.url.split("/");

    const { _id, name } = await this.service.getRestaurant(restaurantId);
    const settings = await this.service.initUser();


    this.name = name;
    this.restaurant = _id;
    this.page = r[3];

    if (typeof settings == "boolean" && settings) {
      this.service.role = "a";
      this.ui.disableDishes = false;
      this.ui.disablePeople = false;
      this.ui.disableCooking = false;
      this.ui.disableSettings = false;
    } else if (typeof settings == "boolean" && !settings) {
      this.router.navigate(["user/info"], { replaceUrl: true });
    } else {
      this.service.role = "m";
      this.ui.disableDishes = !(settings as ManagerSettings).dishes?.overview;
      this.ui.disablePeople = !(settings as ManagerSettings).staff?.overview;
      this.ui.disableCooking = !(settings as ManagerSettings).components?.overview;
      this.ui.disableSettings = !(settings as ManagerSettings).restaurant?.overview;
    }
    this.restaurants = await this.service.get("restaurants");

    this.subs = this.router.events.subscribe((data) => {
      if (data instanceof NavigationEnd) {
        this.page = data.url.split('/')[3];
      }
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}