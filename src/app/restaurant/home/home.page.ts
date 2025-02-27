import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from '../restaurant.service';

interface Result {
    nextEventuallyUrl?: string;
    status?: string;
    payouts?: {
        last4?: string;
        currency?: string;
        status?: string;
    }
    money?: {
        card: "rejected" | "enabled" | "pending" | "disabled" | "restricted";
        cash: "enabled" | "disabled";
        payouts: "enabled" | "restricted" | "pending" | "rejected";
    }
}

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

    data: Result;

    constructor(
        private service: RestaurantService,
        private router: RouterService,
        private loader: LoadService,
        private toastCtrl: ToastController,
    ) { };


    finish() {
        this.router.go([this.data.nextEventuallyUrl]);
    }

    go(page: string) {
        this.router.go(["restaurant", this.service.restaurantId, page]);
    }

    async ngOnInit() {

        try {
            const result = await this.service.get<Result>({}, "home");
            this.data = result;
        } catch (e) {
            if (e.status == 404) {
                this.router.go(["user/info"]);
                (await this.toastCtrl.create({
                    duration: 1500,
                    color: "red",
                    message: "Not found",
                    mode: "ios",
                })).present();
            } else if (e.status == 403) {
                this.router.go(["user/info"]);
                (await this.toastCtrl.create({
                    duration: 1500,
                    color: "red",
                    message: "You are not allowed to be there",
                    mode: "ios",
                })).present();
            }
            return;
        }

        this.loader.end();
    }

}
