import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from 'src/app/restaurant/restaurant.service';


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
    selector: 'app-list',
    templateUrl: './list.page.html',
    styleUrls: ['./list.page.scss'],
})
export class ListPage implements OnInit {

    orders: Order[];
    restaurantId: string;


    constructor(
        private service: RestaurantService,
        private router: RouterService,
    ) { };


    async fullOrder(id: string) {
        this.router.go(["restaurant", this.service.restaurantId, "orders", id], { replaceUrl: false });
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
        this.restaurantId = this.service.restaurantId;
        this.updateOrders();
    }

}
