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
    }

    constructor(
        private service: RestaurantService,
        private popoverCtrl: PopoverController,
        private router: Router,
        private main: MainService,
    ) {
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    };

    async navigation(ev: any) {
        if (this.service.restaurants.length == 0) {
            return;
        }
        this.navClass = "active";

        const popover = await this.popoverCtrl.create({
            event: ev,
            component: NavigationComponent,
            mode: "ios",
            cssClass: "popover-324"
        });

        await popover.present();

        const { role, data } = await popover.onDidDismiss();

        this.navClass = "";

        if (data) {
            return this.router.navigate(["restaurant", data], { replaceUrl: true });
        }

        if (role == "1") {
            this.router.navigate(["user/info"], { replaceUrl: true });
        }
    }

    go(p: string) {
        this.page = p;
        this.router.navigate(["restaurant", this.service.restaurantId, p], { replaceUrl: true });
    }

    verification() {
        this.router.navigate(["restaurant", this.service.restaurantId, "conf", this.verificationUrl]);
    }

    async ngOnInit() {
        this.username = this.main.user.email.split("@")[0];
        this.routerSubs = this.router.events.subscribe(e => {
            if (e instanceof NavigationEnd) {
                this.page = e.url.split("/")[3] || "home";
            }
        });


        const result: { restaurant: any; workAs: string; verificationUrl: string; restaurants: any; } = await this.service.get({}, "restaurant-status");

        console.log(result);

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
