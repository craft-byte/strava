import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MainService } from 'src/app/services/main.service';
import { Restaurant } from 'src/models/general';
import { StaffService } from '../../staff.service';
import { WaiterService } from '../waiter.service';

@Component({
  selector: 'app-waiter',
  templateUrl: './waiter.page.html',
  styleUrls: ['./waiter.page.scss'],
})
export class WaiterPage implements OnInit {

  restaurant: Restaurant = { _id: null };
  dishes: any[] = [];
  orderDishes: any[] = [];

  ui = {
    title: "Waiter",
    disableClose: true
  };


  constructor(
    private router: Router,
    private service: StaffService,
    private route: ActivatedRoute,
    private waiter: WaiterService,
    private main: MainService
  ) { };


  close() {
    this.router.navigate(["staff", this.restaurant._id, "dashboard"], { queryParamsHandling: "preserve", replaceUrl: true });
  }

  async login() {
    this.restaurant._id = this.route.snapshot.paramMap.get("restaurantId");
    this.ui.disableClose = false;
    if(!this.restaurant._id) {
      this.router.navigate([ "user/info" ], { queryParamsHandling: "preserve", replaceUrl: true });
    }

    const result = await this.service.get<{ dishes: any; orderDishes: any; restaurant: Restaurant; }>("waiter", this.restaurant._id, "init");

    if(!result) {
      return false;
    }

    const { orderDishes, dishes, restaurant } = result;

    this.restaurant = restaurant;
    this.orderDishes = orderDishes;
    this.dishes = dishes;

    return true;
  }

  done(id: string) {
    for(let i in this.orderDishes) {
      if(this.orderDishes[i]._id == id) {
        this.waiter.emit("dish/served", { orderId: this.orderDishes[i].orderId, orderDishId: this.orderDishes[i]._id });
        this.orderDishes.splice(+i, 1);
        break;
      }
    }
  }

  async ngOnInit() {

    const result = await this.login();

    if(!result) {
      this.router.navigate(["staff", this.restaurant._id, "dashboard"], { replaceUrl: true });
    }


    this.waiter.connect(this.main.userInfo._id, this.restaurant._id).subscribe(res => {
      console.log(res);
    });
  }

}
