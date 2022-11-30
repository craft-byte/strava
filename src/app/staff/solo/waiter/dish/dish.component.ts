import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';
import { threadId } from 'worker_threads';
import { SoloService } from '../../solo.service';

@Component({
    selector: 'app-waiter-dish',
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

        this.dish = this.s.dishes[this.orderDish.dishId];
        if(!this.dish) {
            this.dish = await this.service.get("dish", this.orderDish.dishId);
            if(this.dish) {
                this.s.dishes[this.orderDish.dishId] = this.dish;
            } else {
                this.s.dishes[this.orderDish.dishId] = { name: "Deleted" };
            }
        }

        this.name = this.dish?.name || this.orderDish.name || "Deleted";
        if(this.dish?.image) {
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
