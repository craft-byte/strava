import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MainService } from '../../main.service';
import { RadminService } from '../radmin.service';

@Component({
  selector: 'app-radmin',
  templateUrl: './radmin.page.html',
  styleUrls: ['./radmin.page.scss'],
})
export class RadminPage implements OnInit {

  restaurant: string;
  name: string;

  restaurants: { name: string; _id: string }[];

  loading = true;

  page = "home";

  constructor(
    public main: MainService,
    private router: Router,
    private service: RadminService,
    private route: ActivatedRoute
  ) { };

  choose({ name, _id: id }: { name: string; _id: string; }) {
    this.restaurant = id;
    this.name = name;
    this.router.navigate(["radmin"], { queryParams: { restaurant: id }, skipLocationChange: false }).then(() => window.location.reload());
    this.ngOnInit();
  }

  goOther(s: 1 | 2) {
    this.router.navigate([`${s === 1 ? "user-info" : "add-restaurant"}`], { replaceUrl: true });
  }

  async go(p: "home" | "people" | "cooking" | "dishes") {
    this.loading = true;
    this.page = p;
    this.router.navigate(["radmin", p], { queryParamsHandling: "preserve" })
    setTimeout(() => {
      this.loading = false;
    }, 200);
  }

  async init(restaurant: string) {
    const r = this.router.url.split("/");
    if(!r[2]) {
      this.page = "home";
      this.router.navigate(["radmin", "home"], { queryParamsHandling: "preserve" });
    } else {
      this.page = r[2].split("?")[0];
    }
    await this.getRestaurant();
    setTimeout(() => {
      this.loading = false;
    }, 300);
    this.restaurants = await this.service.patch({ ids: this.main.userInfo.restaurants.filter(el => el !== restaurant) }, "restaurants");
  }

  async getRestaurant() {
    const restaurant = await this.service.getRestaurant();
    this.restaurant = restaurant._id;
    this.name = restaurant.name;
    return 1;
  }


  async ngOnInit() {
    const restaurant = this.route.snapshot.queryParamMap.get("restaurant");
    if (!restaurant || restaurant == "undefined") {
      this.router.navigate(["user-info"]);
    }
    this.init(restaurant);
  }
}