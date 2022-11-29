import { Component, OnInit, ViewChild, ViewContainerRef, Injector } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantSettings } from 'src/models/components';
import { RestaurantService } from '../restaurant.service';
import { RestaurantRemovePage } from './modals/restaurant-remove/restaurant-remove.page';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

    settings: RestaurantSettings;
    money: {
        cash: string;
        card: string;
        payouts: string;
    };
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
    @ViewChild("payoutsModalContainer", { read: ViewContainerRef }) payoutsModal: ViewContainerRef;
    @ViewChild("modeModalContainer", { read: ViewContainerRef }) modeModal: ViewContainerRef;
    @ViewChild("onlineOrderingModalContainer", { read: ViewContainerRef }) onlineOrderingModal: ViewContainerRef;

    continueRegistration() {
        this.router.go(["restaurant", this.service.restaurantId, "home"]);
    }
    changeLocation() {
        this.router.go(["restaurant", this.service.restaurantId, "conf", "address"], { queryParams: { last: "settings" } });
    }
    qrCodes() {
        this.router.go(["restaurant", this.service.restaurantId, "qr-codes"], { queryParams: { last: this.router.url } } );
    }

    async toast(s: boolean) { // is success true/false
        const toast = await this.toastCtrl.create({
            message: s ? "Successfuly updated." : "Something went wrong. Please try again",
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
        const { ChangeNameComponent } = await import("./modals/change-name/change-name.component");

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
        const { ChangeDescriptionComponent } = await import("./modals/change-description/change-description.component");

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
        const { ChangeTimeComponent } = await import("./modals/change-time/change-time.component");

        const component = this.changeNameContainer.createComponent(ChangeTimeComponent, { injector: this.injector });

        component.instance.time = this.restaurant.time;

        component.instance.leave.subscribe((newTime: any) => {
            if(newTime) {
                this.restaurant.time = newTime;
            }
            component.destroy();
        });
    }
    async payouts() {

        const { PayoutsModalComponent } = await import("./modals/payouts-modal/payouts-modal.component");

        const component = this.payoutsModal.createComponent(PayoutsModalComponent, { injector: this.injector });

        component.instance.bank = this.bank;
        component.instance.status = this.money.payouts;

        component.instance.leave.subscribe((redirect: string) => {
            if(redirect == "bank") {
                this.router.go(["restaurant", this.service.restaurantId, "conf", "bank-account"], { queryParams: { last: "settings" } });
            } else if(redirect == "contact") {
                
            }
            component.destroy();
        });
    }
    async modes() {
        const { ModeModalComponent } = await import("./modals/mode-modal/mode-modal.component");

        const component = this.modeModal.createComponent(ModeModalComponent, { injector: this.injector });

        component.instance.mode = this.settings.staff.mode;

        component.instance.leave.subscribe(async (newMode: string) => {
            if(newMode) {
                const update: any = await this.service.post({ mode: newMode }, "settings/mode");

                if(update.updated) {
                    this.settings.staff.mode = newMode as any;

                    if(newMode == "disabled") {
                        this.settings.customers.allowOrderingOnline = false;
                    }
                } else {
                    this.toast(false);
                }
            }
            component.destroy();
        });
    }
    async changeCustomersSettings(setting: "allowOrderingOnline") {
        if(setting == "allowOrderingOnline" && this.settings.staff.mode == "disabled") {
            return;
        }

        this.settings.customers[setting] = !this.settings.customers[setting];

        const update: any = await this.service.post({ setting }, "settings/customers");

        if(!update.updated) {
            this.settings.customers[setting] = !this.settings.customers[setting];
            this.toast(false);
        }
    }
    async allowOrderingOnline() {
        const { OnlineOrderingModalComponent } = await import("./modals/online-ordering-modal/online-ordering-modal.component");

        const component = this.onlineOrderingModal.createComponent(OnlineOrderingModalComponent);

        component.instance.leave.subscribe(() => {
            component.destroy();
        });
    }


    async ngOnInit() {
        const result: any = await this.service.get({}, "settings");

        this.settings = result.settings;
        this.money = result.money;
        this.bank = result.payoutDestination;
        this.restaurant = result.restaurant;

        this.restaurant._id = this.service.restaurantId;
    }

}
