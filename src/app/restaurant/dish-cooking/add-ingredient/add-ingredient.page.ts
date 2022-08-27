import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { RestaurantService } from '../../services/restaurant.service';
import { IngredientPage } from '../ingredient/ingredient.page';

@Component({
  selector: 'app-add-ingredient',
  templateUrl: './add-ingredient.page.html',
  styleUrls: ['./add-ingredient.page.scss'],
})
export class AddIngredientPage implements OnInit {

  components: any[];
  searchText: string;
  
  timeout: any;

  constructor(
    private service: RestaurantService,
    private modalCtrl: ModalController,
  ) { };

  @Input() dishName: string;

  onInput(e: any) {
    const { target: { value } } = e;

    this.searchText = value;

    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.search();
    }, 800);
  }
  async search() {
    clearTimeout(this.timeout);
    const result = await this.service.patch({ searchText: this.searchText }, "components");

    console.log(result);
    this.components = result as any[];
  }

  close() {
    this.modalCtrl.dismiss();
  }

  async add(id: string) {
    const modal = await this.modalCtrl.create({
      component: IngredientPage,
      mode: "ios",
      cssClass: "modal-width",
      componentProps: {
        id,
        dishName: this.dishName
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if(data) {
      this.modalCtrl.dismiss(data, null, "add");
    }
  }


  async ngOnInit() {
    try {
      this.components = await this.service.get({}, "components/all", this.service.currentDish._id);
    } catch (e) {
      console.error(e);
    }
  }

}
