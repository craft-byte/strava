import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Time } from 'server/src/models/components';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { RestaurantService } from '../../restaurant.service';


interface Order {
    ordered: string;
    type: "dinein" | "takeout";
    id: string;
    status: string;
    mode: string;
    buyer: string;

    user: {
        _id: any;
        username: string;
        avatar: any;
    }

    money: {
        total: number;
        hst: number;
        subtotal: number;
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
        if (last) {
            this.router.go([last]);
        } else {
            this.router.go(["restaurant", this.service.restaurant._id, "orders"], { replaceUrl: false });
        }
    }

    fullCustomer() {
        this.router.go(["restaurant", this.service.restaurant._id, "orders", "customer", this.order.user._id], { queryParams: { last: this.router.url } });
    }


    async ngOnInit() {
        const orderId = this.route.snapshot.paramMap.get("orderId");

        this.order = await this.service.get({}, "people/order", orderId);

        console.log(this.order);

        this.customerAvatar = getImage(this.order.user.avatar);

        this.loader.end();
    }

}