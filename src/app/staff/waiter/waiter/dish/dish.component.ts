import { Component, Input, OnInit } from '@angular/core';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';
import { Dish } from 'src/models/dish';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit {

  image: string;
  interval: any;
  id: string;

  constructor(
    private service: StaffService
  ) { };

  @Input() dish: Dish;
  @Input() orderDish: any;


  async ngOnInit() {
    if(!this.dish) {
      this.dish = await this.service.get("waiter", "dish", this.orderDish.dishId);
    }

    this.id = (this.orderDish._id as string).slice(this.orderDish._id.length - 4, this.orderDish._id.length);

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


    this.image = getImage((this.dish as any).image.binary);
  }

}
