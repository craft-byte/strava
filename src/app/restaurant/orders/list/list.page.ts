import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
    }[];
    by: string;
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

    ui = {
        disableNext: false,
        disablePrev: false,
    }


    constructor(
        private service: RestaurantService,
        private router: RouterService,
        private route: ActivatedRoute,
    ) { };


    async fullOrder(id: string) {
        this.router.go(["restaurant", this.service.restaurantId, "orders", id], { replaceUrl: false });
    }
    
    next() {
        const p = this.route.snapshot.queryParamMap.get("p");

        this.router.go([], { relativeTo: this.route, queryParams: { p: Number(p || 1) + 1 }});
    }
    prev() {
        const p = this.route.snapshot.queryParamMap.get("p");

        if(!isNaN(Number(p)) && Number(p) > 0) {
            this.router.go([], { relativeTo: this.route, queryParams: { p: Number(p) - 1 }});
        }
    }
    
    async ngOnInit() {
        const skip = this.route.snapshot.queryParamMap.get("p");
        this.restaurantId = this.service.restaurantId;

        if(!skip || Number(skip) == 0) {
            this.ui.disablePrev = true;
        }

        this.orders = await this.service.get({ skip: Number(skip) }, "people", "orders");

        if(this.orders.length != 12) {
            this.ui.disableNext = true;
        }
    }

}
