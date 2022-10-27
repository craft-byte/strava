import { Component, OnInit, ViewChild, ViewContainerRef, Injector } from '@angular/core';
import { ModalController, PopoverController, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantSettings } from 'src/models/components';
import { isFunction } from 'util';
import { RestaurantService } from '../services/restaurant.service';
import { RestaurantRemovePage } from './restaurant-remove/restaurant-remove.page';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

    settings: RestaurantSettings;
    money: any;
    bank: any;
    restaurant: any;
    timeout: any;
    timeout2: any;
    timeout3: any;



    continuePopover: any;

    constructor(
        private router: RouterService,
        private loader: LoadService,
        private service: RestaurantService,
        private toastCtrl: ToastController,
        private modalCtrl: ModalController,
        private injector: Injector,
    ) { };

    @ViewChild("changeNameContainer", { read: ViewContainerRef }) changeNameContainer: ViewContainerRef;
    @ViewChild("changeDescriptionContainer", { read: ViewContainerRef }) changeDescriptionContainer: ViewContainerRef;


    payoutsChange() {
        this.router.go(["restaurant", this.service.restaurantId, "conf", "bank-account"]);
    }
    continueRegistration() {
        this.router.go(["restaurant", this.service.restaurantId, "home"]);
    }



    async select(field1: string, field2: string, event: any) {
        await this.loader.start();
        const { target: { value } } = event;

        clearTimeout(this.timeout3);

        this.timeout3 = setTimeout(async () => {
            const result: any = await this.service.post({ field1, field2, value: value == "true" ? true : false }, "settings");

            this.toast(result.updated);

            if (result.updated) {
                this.settings[field1][field2] = value == "true" ? true : false;
            }
            this.loader.end();
        }, 600);
    }
    async check(field1: string, field2: string, event: any) {
        await this.loader.start();
        clearTimeout(this.timeout2);

        this.timeout2 = setTimeout(async () => {
            const result: any = await this.service.post({ field1, field2, value: event.target.checked ? "unlimited" : 0 }, "settings");

            this.toast(result.updated);

            if (result.updated) {
                this.settings[field1][field2] = event.target.checked ? "unlimited" : 0;
            }
            this.loader.end();
        }, 600);
    }
    async input(field1: string, field2: string, event: any) {
        const { target: { value } } = event;

        clearTimeout(this.timeout);

        this.timeout = setTimeout(async () => {
            const result: any = await this.service.post({ field1, field2, value: Number(value) || 0 }, "settings");

            this.toast(result.updated);

            if (result.updated) {
                this.settings[field1][field2] = value || 0;
            }

        }, 600);
    }

    async toast(s: boolean) { // is success true/false
        const toast = await this.toastCtrl.create({
            message: s ? "Successfuly updated." : "Something went wrong. Try again later",
            duration: 1000,
            color: s ? "green" : "red",
            mode: "ios",
        });

        toast.present();
    }

    async cashChange(e: any) {
        this.money.cash = e.target.checked ? "enabled" : "disabled";
        const result: any = await this.service.post({ value: e.target.checked }, "settings/cash");

        if (!result.updated) {
            this.money.cash = e.target.checked ? "disabled" : "enabled";
            await this.toast(false);
        }
    }
    async cardChange(e: any) {
        if (this.money.card == "enabled" || this.money.card == "disabled") {
            this.money.card = e.target.checked ? "enabled" : "disabled";

            const result: any = await this.service.post({ value: e.target.checked }, "settings/card");

            if (!result.updated) {
                this.money.card == e.target.checked ? "disabled" : "enabled";
                this.toast(false);
            }
        }
    }
    async removeRestaurant() {
        const modal = await this.modalCtrl.create({
            component: RestaurantRemovePage,
            mode: "ios",
            componentProps: {
                name: this.service.restaurant.name,
            }
        });

        await modal.present();

        const { data } = await modal.onDidDismiss();

        if (data) {
            await this.loader.start();
            try {
                const result: any = await this.service.delete("");
                if (result.removed) {
                    this.router.go(["user/info"], { replaceUrl: true });
                    (await this.toastCtrl.create({
                        duration: 2000,
                        color: "green",
                        message: "Restaurant successfuly removed",
                        mode: "ios",
                    })).present();
                } else {
                    (await this.toastCtrl.create({
                        duration: 2000,
                        color: "green",
                        message: "Something went wrong. Please try again later.",
                        mode: "ios",
                    })).present();
                }
            } catch (e) {
                if (e == 403) {
                    this.router.go(["user/info"], { replaceUrl: true });
                    (await this.toastCtrl.create({
                        duration: 2000,
                        color: "green",
                        message: "You are not allowed to do that.",
                        mode: "ios",
                    })).present();
                }
            }
            this.loader.end();
        }
    }
    async changeName() {
        const { ChangeNameComponent } = await import("./change-name/change-name.component");

        const component = this.changeNameContainer.createComponent(ChangeNameComponent, { injector: this.injector });

        component.instance.name = this.restaurant.name;

        component.instance.leave.subscribe((nn: string) => {
            if(nn) {
                this.restaurant.name = nn;
                this.service.restaurant.name = nn;
            }
            component.destroy();
        });
    }
    async changeDescription() {
        const { ChangeDescriptionComponent } = await import("./change-description/change-description.component");

        const component = this.changeNameContainer.createComponent(ChangeDescriptionComponent, { injector: this.injector });

        component.instance.description = this.restaurant.description;

        component.instance.leave.subscribe((nd: string) => {
            if(nd) {
                this.restaurant.description = nd;
            }
            component.destroy();
        });
    }
    async changeTime() {
        const { ChangeTimeComponent } = await import("./change-time/change-time.component");

        const component = this.changeNameContainer.createComponent(ChangeTimeComponent, { injector: this.injector });

        component.instance.time = this.restaurant.time;

        component.instance.leave.subscribe((newTime: any) => {
            if(newTime) {
                this.restaurant.time = newTime;
            }
            component.destroy();
        });
    }
    changeLocation() {
        this.router.go(["restaurant", this.service.restaurantId, "conf", "address"], { queryParams: { last: "settings" } });
    }

    async ngOnInit() {
        await this.loader.start();
        const result: any = await this.service.get({}, "settings");

        this.settings = result.settings;
        this.money = result.money;
        this.bank = result.payoutDestination;
        this.restaurant = result.restaurant;

        console.log(this.restaurant);

        this.loader.end();
    }

}
