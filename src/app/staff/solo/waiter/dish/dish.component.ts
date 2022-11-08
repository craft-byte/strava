import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';
import { SoloService } from '../../solo.service';

@Component({
    selector: 'app-waiter-dish',
    templateUrl: './dish.component.html',
    styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit, OnDestroy {

    dish: any;
    image: string;

    interval: any;

    constructor(
        private s: SoloService,
        private service: StaffService,
    ) { };

    @Input() orderDish: any;

    async ngOnInit() {
        this.dish = this.s.dishes[this.orderDish.dishId];
        if(!this.dish) {
            this.dish = await this.service.get("dish", this.orderDish.dishId);
            this.s.dishes[this.dish._id] = this.dish;
        }

        if(this.dish.image) {
            this.image = getImage(this.dish.image.binary);
        }

        setTimeout(() => {
            this.orderDish.time.minutes++;
            if(this.orderDish.time.minutes == 60) {
                this.orderDish.time.minutes == 0;
                this.orderDish.time.hours++;
            }
            this.interval = setInterval(() => {
                this.orderDish.time.minutes++;
                if(this.orderDish.time.minutes == 60) {
                    this.orderDish.time.minutes == 0;
                    this.orderDish.time.hours++;
                }
            }, 60000);
        }, this.orderDish.time.nextMinute);
    }

    ngOnDestroy(): void {
        clearInterval(this.interval);
    }

}
