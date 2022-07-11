import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';
import { Dish } from 'src/models/dish';
import { DishModalPage } from '../dish-modal/dish-modal.page';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit {

  image: string;

  constructor(
    private modalCtrl: ModalController,
    private service: StaffService
  ) { };

  @Input() dish: Dish;
  @Input() orderDish: any;

  @Output() Emitter = new EventEmitter();

  async open() {
    const modal = await this.modalCtrl.create({
      component: DishModalPage,
      cssClass: "modal-width",
      mode: "ios",
      componentProps: {
        name: this.dish.name,
        type: this.orderDish.table
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if(data) {
      this.Emitter.emit(this.orderDish._id);
    }
  }

  async ngOnInit() {
    if(!this.dish) {
      this.dish = await this.service.get("waiter", this.service.restaurantId, "dish", this.orderDish.dishId);
      console.log(this.dish);
    }
    this.image = getImage((this.dish as any).image.binary);
  }

}
