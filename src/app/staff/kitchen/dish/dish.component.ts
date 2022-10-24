import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { getImage } from 'src/functions';
import { StaffService } from '../../staff.service';
import { KitchenService } from '../kitchen.service';

interface Dish {
  name: string;
  time: string;
}

interface OrderDish {
  dishId: string;
  taken: string;
  time: {
    hours: number;
    minutes: number;
    color: string;
    nextMinute: number;
  }
}

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit, OnDestroy {

  dish: any;
  image: string;
  userId: string;

  time: number;

  interval: any;

  constructor(
    private kitchen: KitchenService,
    private service: StaffService,
    private main: MainService,
  ) {
    this.userId = this.main.userInfo._id;
  };

  @Input() orderDish: OrderDish;

  async ngOnInit() {
    this.dish = this.kitchen.dishes[this.orderDish.dishId];
    if(!this.dish) {
      this.dish = await this.service.get("kitchen/dish", this.orderDish.dishId);
    }
    this.image = getImage(this.dish.image.binary);

    if(this.orderDish.time) {
        setTimeout(() => {
          this.orderDish.time.minutes ++;
          if(this.orderDish.time.minutes == 60) {
            this.orderDish.time.minutes = 0;
            this.orderDish.time.hours ++;
          }
          this.interval = setInterval(() => {
            this.orderDish.time.minutes ++;
            if(this.orderDish.time.minutes == 60) {
              this.orderDish.time.minutes = 0;
              this.orderDish.time.hours ++;
            }
          }, 60000);
        }, this.orderDish.time.nextMinute);
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }
}
