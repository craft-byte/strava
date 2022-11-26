import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';
import { SoloService } from '../../solo.service';

@Component({
    selector: 'app-dish',
    templateUrl: './dish.component.html',
    styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit, OnDestroy {

    dish: any;
    image: string;
    name: string;
    interval: any;

    constructor(
        private s: SoloService,
        private service: StaffService,
    ) { };

    @Input() orderDish: any;

    async ngOnInit() {

        console.log(this.orderDish);

        if(this.s.dishes[this.orderDish.dishId]) {
            this.dish = this.s.dishes[this.orderDish.dishId];
        } else {
            this.dish = await this.service.get("dish", this.orderDish.dishId);
            if(this.dish) {
                this.s.dishes[this.dish?._id] = this.dish;
            } else {
                this.s.dishes[this.orderDish.dishId] = { name: "Deleted" };
            }
        }

        this.name = this.dish?.name || this.orderDish.name || "Deleted";
        this.image = getImage(this.dish?.image?.binary);

        if(this.orderDish.time) {
            setTimeout(() => {
                this.orderDish.time.minutes++;
                if(this.orderDish.time.minutes == 60) {
                    this.orderDish.time.hours++;
                    this.orderDish.time.minutes = 0;
                }
                this.interval = setInterval(() => {
                    this.orderDish.time.minutes++;
                    if(this.orderDish.time.minutes == 60) {
                        this.orderDish.time.hours++;
                        this.orderDish.time.minutes = 0;
                    }
                }, 60000);
            }, this.orderDish.time.nextMinute);
        }
    }

    ngOnDestroy(): void {
        clearInterval(this.interval);
    }
}
