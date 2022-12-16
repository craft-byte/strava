import { Component, OnInit } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { RestaurantService } from '../../restaurant.service';


interface Customer {
    name: string;
    avatar: any;
    orders: number;
    lastOrdered: string;
    total: number;
    _id: string;
    blacklisted: boolean;
}

@Component({
    selector: 'app-customers',
    templateUrl: './customers.page.html',
    styleUrls: ['./customers.page.scss'],
})
export class CustomersPage implements OnInit {

    customers: Customer[];
    qrCodes: { table: number; downloadUrl: any; link: string; }[];
    restaurantName: string;
    lastUpdate: string;

    ui = {
        showBest: false,
        showQrCodes: true,
    };

    constructor(
        private service: RestaurantService,
        private toastCtrl: ToastController,
        private router: RouterService,
    ) {
    };


    find(e: any) {
        return e;
    }

    fullCustomer(id: string) {
        this.router.go(["restaurant", this.service.restaurant._id, "orders", "customer", id]);
    }

    async addTable() {
        const result: any = await this.service.post({}, "customers", "table");

        this.qrCodes.push({
            table: this.qrCodes.length + 1,
            link: result.link,
            downloadUrl: null
        });

        if (!result.updated) {
            this.qrCodes.pop();
            (await this.toastCtrl.create({
                duration: 1500,
                color: "red",
                message: "Table is not added. Please, try again later.",
                mode: "ios"
            })).present();
        }

    }
    async removeTable() {
        const result: any = await this.service.delete("customers", "table");

        const last = this.qrCodes.pop();

        if (!result.updated) {
            this.qrCodes.push(last);
            (await this.toastCtrl.create({
                duration: 1500,
                color: "red",
                message: "Table is not removed. Please, try again later.",
                mode: "ios"
            })).present();
        }
    }

    onChangeURL(event: SafeUrl, table: number) {
        this.qrCodes[table].downloadUrl = event;
    }
    user(id: string) {
        this.router.go(["restaurant", this.service.restaurant._id, "orders", "customer", id], { replaceUrl: true });
    }


    async updateCustomers(calculate: boolean) {

        const result: {
            customers: Customer[];
            lastUpdate: string;
            qrCodes: {
                table: number;
                link: string;
                downloadUrl: string;
            }[];
        } = await this.service.get({ calculate }, "customers");


        this.lastUpdate = result.lastUpdate;

        this.qrCodes = result.qrCodes;

        if (!result) {
            return;
        }

        this.customers = result.customers;
        for (let i of this.customers) {
            i.avatar = getImage(i.avatar) || "./../../../../assets/images/plain-avatar.jpg";
        }


    }


    ngOnInit() {
        this.restaurantName = this.service.restaurant?.name;
        this.updateCustomers(false);
    }

}
