import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';
import { Dish } from 'src/models/dish';
import { KitchenDish } from 'src/models/kitchen';
import { KitchenService } from '../kitchen.service';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit {

  image: string;

  constructor(
    private kitchen: KitchenService,
    private service: StaffService
  ) { };

  @Input() dish: Dish;
  @Input() orderDish: KitchenDish;
  @Output() Emitter = new EventEmitter();

  chooseDish() {
    this.Emitter.emit({orderDish: this.orderDish, dish: this.dish });
  }

  async ngOnInit() {
    if(!this.dish) {
      this.dish = await this.service.get("kitchen", this.service.restaurantId, "dish", this.orderDish.dishId);
      this.kitchen.convertedDishes[this.dish._id] = this.dish;
    }
    this.image = await getImage((this.dish as any).image);
  }

}