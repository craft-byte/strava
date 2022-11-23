import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { StringOrNumberOrDate } from '@swimlane/ngx-charts';
import { Subscription } from 'rxjs';
import { Restaurant } from 'src/models/general';
import { MainService } from '../services/main.service';
import { RestaurantService } from './restaurant.service';

@Component({
    selector: 'app-restaurant',
    templateUrl: './restaurant.page.html',
    styleUrls: ['./restaurant.page.scss'],
})
export class RestaurantPage implements OnInit, OnDestroy {

    navClass: string;
    restaurant: Restaurant;
    page: string = "home";
    username: string;
    routerSubs: Subscription;
    verificationUrl: string;
    workUrl: string;

    ui = {
        showButtonNearRestaurantName: false,
        showGoWorkButton: false,
        disableAllButtons: false,
    }

    constructor(
        private service: RestaurantService,
        private popoverCtrl: PopoverController,
        private router: Router,
        private main: MainService,
    ) {
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    };

    redirect() {
        this.ui.disableAllButtons = true;
    }

    verification() {
        this.router.navigate(["restaurant", this.service.restaurantId, "conf", this.verificationUrl]);
    }

    async ngOnInit() {
        this.username = this.main.user.email.split("@")[0];
        this.routerSubs = this.router.events.subscribe(e => {
            if (e instanceof NavigationEnd) {
                this.page = e.url.split("/")[3] || "home";
                this.ui.disableAllButtons = false;
            }
        });


        const result: { restaurant: any; workAs: string; verificationUrl: string; mode: string; restaurants: any; } = await this.service.get({}, "restaurant-status");

        if(result) {
            console.log("JDKASDJAKSJKDJSKJDKSJDKJAKSJDKAJSKDJAS");
            this.restaurant = result.restaurant;
            this.verificationUrl = result.verificationUrl;
            
            this.service.restaurantId = result.restaurant._id;
            this.service.restaurant = result.restaurant;

            if(result.mode != "disabled") {
                this.workUrl = `/staff/${ result.restaurant?._id }/${ result.workAs == 'both' ? 'solo' : result.workAs }`
            } else {
                this.workUrl = `/staff/${ result.restaurant?._id }`;
            }
        }
    }

    ngOnDestroy(): void {
        this.routerSubs.unsubscribe()
    }

}
