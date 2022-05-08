import { ThisReceiver } from '@angular/compiler';
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { getImage } from 'src/functions';
import { Dish } from 'src/models/dish';
import { KitchenDish } from 'src/models/kitchen';
import { StaffService } from '../../staff.service';
import { KitchenService } from '../kitchen.service';

@Component({
  selector: 'dish-modal',
  templateUrl: './dish-modal.page.html',
  styleUrls: ['./dish-modal.page.scss'],
})
export class DishPage implements OnInit {

  image: string;
  showDish = false;
  cooking: { recipee: string; components: { name: string; amount: string }[] };

  color: string;
  button: string;
  title = "";

  constructor(
    private modalCtrl: ModalController,
    private service: StaffService,
    private kitchen: KitchenService
  ) { }

  @Input() dish: Dish;
  @Input() orderDish: KitchenDish;

  close() {
    this.modalCtrl.dismiss();
  }

  handle() {
    if(this.orderDish.taken) {
      this.done();
    } else {
      this.take();
    }
  }

  done() {
    this.kitchen.emit("kitchen/dish/done", { orderDishId: this.orderDish._id, orderId: this.orderDish.orderId, dishId: this.orderDish.dishId });
    this.modalCtrl.dismiss();
    for(let i in this.kitchen.dishes[this.orderDish.type.value]) {
      if(this.kitchen.dishes[this.orderDish.type.value][i]._id == this.orderDish._id) {
        this.kitchen.dishes[this.orderDish.type.value].splice(+i, 1);
        break;
      }
    }
  }

  take() {
    this.kitchen.emit("kitchen/dish/take", { orderDishId: this.orderDish._id, orderId: this.orderDish.orderId });
    this.modalCtrl.dismiss();
    for(let i in this.kitchen.dishes[this.orderDish.type.value]) {
      if(this.kitchen.dishes[this.orderDish.type.value][i]._id == this.orderDish._id) {
        this.kitchen.dishes[this.orderDish.type.value][i].taken = true;
        this.kitchen.dishes[this.orderDish.type.value][i].takenTime = "just now";
        this.kitchen.dishes[this.orderDish.type.value].push(this.kitchen.dishes[this.orderDish.type.value].splice(+i, 1)[0]);
      }
    }
  }

  async ngOnInit() {
    if(!this.dish) {
      this.dish = await this.service.get("dishes/details", this.orderDish.dishId);
      this.kitchen.convertedDishes[this.dish._id] = this.dish;
    }
    if(this.orderDish.taken) {
      this.color = "gray";
      this.title = this.orderDish.takenTime;
      this.button = "Done";
    } else {
      this.color = this.orderDish.time.color;
      this.button = "Take";
    }
    this.image = await getImage(this.dish.image);
    this.showDish = true;
    this.cooking = await this.service.get("kitchen", this.service.restaurantId, "dishes/cooking", this.orderDish.dishId);

    console.log(this.cooking);
  }

}