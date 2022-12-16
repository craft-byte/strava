import { Component, Input, OnInit } from '@angular/core';
import { RestaurantService } from 'src/app/restaurant/restaurant.service';

@Component({
    selector: 'app-analytics',
    templateUrl: './analytics.component.html',
    styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements OnInit {

    data: any;

    colorScheme: any = {
        domain: ['#FFC409', '#2ECC71', '#3880FF', '#E74DBF', "#9B1FE8", "#EB445A"]
    };

    constructor(
        private service: RestaurantService,
    ) { };

    @Input() dishId: string;

    async ngOnInit() {
        this.data = await this.service.get({}, "dishes", this.dishId, "analytics");

        console.log(this.data);
    }

}
