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


    data: {
        orders: HistoryOrder[];
        stats: any;
    }

    constructor(
        private service: CustomerService,
        private router: RouterService,
        private loader: LoadService,
    ) { }

    async ngOnInit() {
        await this.loader.start();


        try {
            const result: { orders: HistoryOrder[], stats: any } = await this.service.get({ length: "2" }, "history");
            this.data = result;


            console.log(result);

        } catch (e) {
            if (e == 422) {
                this.router.go(["customer", "scan"]);
            }
        }


        this.loader.end();
    }

}
