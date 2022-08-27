import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Time } from 'server/src/models/components';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { threadId } from 'worker_threads';
import { RestaurantService } from '../../services/restaurant.service';


interface Order {
  ordered: string;
  total: number;
  type: "Order" | "Table";
  id: string;
  status: string;
  customer: {
    userId: any;
    username: string;
    avatar: any;
  }

  dishes: {
      name: string;
      status: string;
      dishId: string;
      _id: string;

      taken?: Time;
      cooked?: Time;
      served?: Time;


      cook?: {
          username: string;
          avatar: any;
          userId: string;
      };
      waiter?: {
          username: string;
          avatar: any;
          userId: string;
      }

      removed?: {
          username: string;
          avatar: any;
          time: Time;
          role: string;
      };
  }[];
};


@Component({
  selector: 'app-full-order',
  templateUrl: './full-order.page.html',
  styleUrls: ['./full-order.page.scss'],
})
export class FullOrderPage implements OnInit {

  order: Order;

  customerAvatar: string;

  constructor(
    private router: RouterService,
    private route: ActivatedRoute,
    private service: RestaurantService,
    private loader: LoadService,
    private alertCtrl: AlertController,
  ) { };

  back() {
    const last = this.route.snapshot.queryParamMap.get("last");
    if(last) {
      this.router.go([last]);
    } else {
      this.router.go(["restaurant", this.service.restaurantId, "people", "orders"], { replaceUrl: false });
    }
  }

  fullCustomer() {
    this.router.go(["restaurant", this.service.restaurantId, "people", "customer", this.order.customer.userId], { queryParams: { last: this.router.url } });
  }


  async ngOnInit() {
    await this.loader.start();
    const orderId = this.route.snapshot.paramMap.get("orderId");

    this.order = await this.service.get({}, "people/order", orderId);

    this.customerAvatar = getImage(this.order.customer.avatar);

    console.log(this.order);
    this.loader.end();
  }

}