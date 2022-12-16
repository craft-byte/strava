import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
  selector: 'app-ingredient',
  templateUrl: './ingredient.page.html',
  styleUrls: ['./ingredient.page.scss'],
})
export class IngredientPage implements OnInit {


  component: any;
  amount: number;

  
  constructor(
    private modalCtrl: ModalController,
    private service: RestaurantService,
  ) { };

  @Input() id: string;
  @Input() dishName: string;

  close() {
    this.modalCtrl.dismiss();
  }
  submit() {
    this.modalCtrl.dismiss({ id: this.id, amount: this.amount, name: this.component.name });
  }


  async ngOnInit() {
    try {
      this.component = await this.service.get({}, "components", this.id);
    } catch (e) {
      if(e == 404) {
        this.modalCtrl.dismiss();
      }
    }
  }

}
