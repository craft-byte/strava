import { Component, OnInit } from '@angular/core';
import { CustomerService } from 'src/app/customer/customer.service';

interface Dish {
    _id: string;
    image: any;
    name: string;
    price: number;
    time: number;
    general: string;
    description: string;
}

@Component({
    selector: 'app-recommendations',
    templateUrl: './recommendations.page.html',
    styleUrls: ['./recommendations.page.scss'],
})
export class RecommendationsPage implements OnInit {

    dishes: Dish[];

    constructor(
        private service: CustomerService,
    ) { }

    async ngOnInit() {

        this.dishes  = await this.service.get({}, "order", this.service.restaurantId, "recommendations");

    }

}
