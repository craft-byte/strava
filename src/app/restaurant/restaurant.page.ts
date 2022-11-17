import { Component, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Restaurant } from 'src/models/general';
import { MainService } from '../services/main.service';
import { NavigationComponent } from './other/navigation/navigation.component';
import { RestaurantService } from './services/restaurant.service';

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
    workAs: string;
    routerSubs: Subscription;
    verificationUrl: string;

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


        const result: { restaurant: any; workAs: string; verificationUrl: string; restaurants: any; } = await this.service.get({}, "restaurant-status");

        if(result) {
            this.restaurant = result.restaurant;
            this.workAs = result.workAs;
            this.verificationUrl = result.verificationUrl;
            
            this.service.restaurantId = result.restaurant._id;
            this.service.restaurant = result.restaurant;
        }
    }

    ngOnDestroy(): void {
        this.routerSubs.unsubscribe()
    }

}
