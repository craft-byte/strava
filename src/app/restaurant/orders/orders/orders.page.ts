import { Component, OnInit } from '@angular/core';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { RestaurantService } from '../../restaurant.service';

interface Order {
    user: {
        name: string;
        username: string;
        _id: string;
        avatar: any;
    };
    dishes: {
        name: string;
        price: number;
        _id: string;
    }[]
    date: string;
    status: string;
    total: number;
    _id: string;
    avatar?: string;
    blacklisted: boolean;
    statusColor: "green" | "red" | "purple";
}

@Component({
    selector: 'app-orders',
    templateUrl: './orders.page.html',
    styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit {

    orders: Order[];

    constructor(
        private service: RestaurantService,
        private router: RouterService,
        private loader: LoadService,
    ) { };

    async fullOrder(id: string) {
        this.router.go(["restaurant", this.service.restaurantId, "orders", id], { replaceUrl: false });
    }

    customers() {
        this.router.go(["restaurant", this.service.restaurantId, "customers"]);
    }

    async updateOrders() {
        this.orders = null;

        try {
            this.orders = await this.service.get({}, "people", "orders");
        } catch (e) {
            console.error(e);
        }
    }

    ngOnInit() {
        this.updateOrders();
    }

}
