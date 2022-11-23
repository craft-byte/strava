import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from '../restaurant.service';



@Component({
    selector: 'app-orders',
    templateUrl: './orders.page.html',
    styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit, OnDestroy {

    restaurantId: string;
    current: string;

    subscription: Subscription;

    constructor(
        private service: RestaurantService,
        private router: RouterService,
        private r: Router
    ) {
        this.subscription = this.r.events.subscribe(e => {
            if(e instanceof NavigationEnd) {
                this.current = e.url.split("/")[4] || "list";
            }
        })
    };

    customers() {
        this.router.go(["restaurant", this.service.restaurantId, "customers"]);
    }

    ngOnInit() {
        this.restaurantId = this.service.restaurantId;
        this.current = this.router.url.split("/")[this.router.url.split("/").length - 1].split("?")[0];
    }
    ngOnDestroy(): void {
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
    }

}
