import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { User } from 'src/models/user';
import { RestaurantService } from '../../services/restaurant.service';

interface Order {
  _id: string;
  date: any;
  dishes: any[];
  status: string;
  color: string;
}
interface Details {
  total: number;
  visited: string;
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
})
export class CustomerPage implements OnInit {

  orders: Order[];
  blacklisted: boolean;
  user: User;
  details: Details;
  image: string;

  constructor(
    private service: RestaurantService,
    private router: RouterService,
    private route: ActivatedRoute,
    private loader: LoadService,
  ) { };

  async ngOnInit() {
    await this.loader.start();
    const userId = this.route.snapshot.paramMap.get("userId");

    const result: any = await this.service.get({}, "customers", userId);

    if(!result) {
      return this.router.go(["restaurant", this.service.restaurantId, "people", "customers"], { replaceUrl: true });
    }

    const { orders, blacklisted, user, details } = result;

    this.orders = orders;
    this.blacklisted = blacklisted;
    this.user = user;
    this.details = details;


    this.image = getImage(this.user.avatar) || "./../../../assets/images/plain-avatar.jpg";

    this.loader.end();
  }

}
