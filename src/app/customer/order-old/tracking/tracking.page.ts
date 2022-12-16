import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Time } from 'server/src/models/components';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { CustomerService } from '../../customer.service';
import { OrderService } from '../order.service';


interface Tracking {
    dishes: { [dishId: string]: { name: string; image: any; _id: string; } };
    theme: string;
    orders: {
        type: "Order" | "Table";
        id: string;
        _id: string;
        ordered: Time;
        dishes: {
            status: "ordered" | "cooking" | "cooked" | "served" | "removed";
            dishId: string;
            _id: string;
        }[];
    }[];
}


@Component({
    selector: 'app-tracking',
    templateUrl: './tracking.page.html',
    styleUrls: ['./tracking.page.scss'],
})
export class TrackingPage implements OnInit {

    orders: Tracking["orders"];
    dishes: Tracking["dishes"];
    theme: string;

    constructor(
        private service: CustomerService,
        private order: OrderService,
        private router: RouterService,
        private loader: LoadService,
        private sanitizer: DomSanitizer,
    ) { };

    back() {
        this.router.go(["customer", "order", this.service.restaurantId,]);
    }

    async ngOnInit() {
        await this.loader.start();
        this.theme = this.service.theme;

        try {
            
            const result: Tracking = await this.service.get({}, "order", this.service.restaurantId, "tracking");
    
            if(result) {

                this.dishes = result.dishes;
                this.orders = result.orders;
                this.theme = result.theme;
        

                for (let i of Object.keys(result.dishes)) {
                    this.dishes[i].image = this.sanitizer.bypassSecurityTrustUrl(getImage(this.dishes[i]?.image.binary)) || "./../../../../assets/images/no-image.jpg";
                }
        
                this.order.subs().subscribe((res: any) => {
                    const { type } = res;
        
                    if (type == "customer/dish/status") {
                        const { orderDishId, orderId, status } = res.data;
                        for (let i of this.orders) {
                            if (i._id == orderId) {
                                for (let d of i.dishes) {
                                    if (d._id == orderDishId) {
                                        switch (status) {
                                            case 1:
                                                d.status = "ordered"
                                                break;
                                            case 2:
                                                d.status = "cooking"
                                                break;
                                            case 3:
                                                d.status = "cooked"
                                                break;
                                            case 4:
                                                d.status = "served"
                                                break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            }
        } catch (e) {
            if(e.status == 404) {
                this.back();
                return;
            }
            this.back();
        }

        this.loader.end();
    }

}
