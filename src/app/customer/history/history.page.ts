import { Component, OnInit } from '@angular/core';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { CustomerService } from '../customer.service';


interface HistoryOrder {
    restaurant: {
        name: string;
        _id: string;
    };
    order: {
        id: string;
        _id: string;
        type: string;
        dishes: number;
        date: string;
        status: string;
        money: {
            total: number;
            hst: number;
            subtotal: number;
        };
    };
};


@Component({
    selector: 'app-history',
    templateUrl: './history.page.html',
    styleUrls: ['./history.page.scss'],
})
export class HistoryPage implements OnInit {

    orders: HistoryOrder[];

    constructor(
        private service: CustomerService,
        private router: RouterService,
        private loader: LoadService,
    ) { }

    async ngOnInit() {
        await this.loader.start();


        try {
            this.orders = await this.service.get({ length: "2" }, "history");

            console.log(this.orders);
        } catch (e) {
            if (e == 422) {
                this.router.go(["customer", "scan"]);
            }
        }


        this.loader.end();
    }

}
