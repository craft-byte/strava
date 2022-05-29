import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Dish } from 'src/models/dish';
import { KitchenDish } from 'src/models/kitchen';
import { StaffService } from '../../staff.service';
import { DishPage } from '../dish-modal/dish-modal.page';
import { KitchenService } from '../kitchen.service';

@Component({
  selector: 'app-department-modal',
  templateUrl: './department-modal.page.html',
  styleUrls: ['./department-modal.page.scss'],
})
export class DepartmentModalPage implements OnInit {

  convertedDishes: { _id: string; dishId: string; takenTime: string; taken: { userId: string; }; image: string; name: string; time: { color: string; title: string } }[] = null;

  constructor(
    private modalCtrl: ModalController,
    private service: StaffService,
    public kitchen: KitchenService
  ) { };

  @Input() color: string;
  @Input() title: string;
  @Input() type: string;


  close() {
    this.modalCtrl.dismiss();
  }

  async openDishModal(data: any) {
    const modal = await this.modalCtrl.create({
      component: DishPage,
      swipeToClose: true,
      cssClass: "department-modal",
      componentProps: {
        orderDish: data.orderDish,
        dish: data.dish
      },
      mode: "ios"
    });

    await modal.present();
  }

  async ngOnInit() {
    if(!this.service.restaurantId) {
      this.modalCtrl.dismiss();
      return;
    }
    this.convertedDishes = await this.service.post({ dishes: this.kitchen.dishes[this.type] }, "kitchen", this.service.restaurantId, "dishes", "convert");

  }

}
