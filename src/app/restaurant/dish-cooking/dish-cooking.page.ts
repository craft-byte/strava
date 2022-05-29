import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { RestaurantService } from '../services/restaurant.service';
import { IngredientModalPage } from './ingredient-modal/ingredient-modal.page';

interface Dish {
  name: string;
  _id: string;
}
interface Ing {
  name: string;
  _id: string;
  amount: number;
}

@Component({
  selector: 'app-dish-cooking',
  templateUrl: './dish-cooking.page.html',
  styleUrls: ['./dish-cooking.page.scss'],
})
export class DishCookingPage implements OnInit {


  dish: Dish;
  components: Ing[];
  recipee: string;
  selected: Ing[] = [];

  timeout: any;

  ui = {
    disableSave: false,
  };

  constructor(
    private route: ActivatedRoute,
    private service: RestaurantService,
    private router: Router,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
  ) { };

  close() {
    this.router.navigate(["restaurant", this.service.restaurantId, "dishes", "full", this.dish._id], { replaceUrl: true });
  }

  find(event: any) {
    const { target: { value } } = event;
    clearTimeout(this.timeout);
    
    this.timeout = setTimeout(async () => {
      this.addComponents(
        await this.service.patch({ searchText: value }, "components")
      );
    }, 1000);
  }

  async edit(comp: Ing) {
    const modal = await this.modalCtrl.create({
      component: IngredientModalPage,
      mode: "ios",
      swipeToClose: true,
      cssClass: "modal-width",
      componentProps: {
        data: comp
      }
    });

    await modal.present();

    const { data: d } = await modal.onDidDismiss();

    if(d) {
      if (d.type == 1) {
        if (!d.amount || d.amount < 1) {
          (await this.toastCtrl.create({
            message: "Amount should be more than 0 grams :/",
            color: "red",
            duration: 3000,
            mode: "ios"
          })).present();
          return;
        }
        for (let i in this.selected) {
          if (this.selected[i]._id == comp._id) {
            this.selected[i].amount = d.amount;
          }
        }
      } else if (d.type == 2) {
        for (let i in this.selected) {
          if (this.selected[i]._id == comp._id) {
            delete this.selected[i].amount;
            this.components.push(this.selected.splice(+i, 1)[0]);
            break;
          }
        }
      }
    }
  }

  async onIngredientEmit(data: { _id: string; amount?: number; data?: any }) {
    if (!data.amount || data.amount < 1) {
      (await this.toastCtrl.create({
        message: "Amount should be more than 0 grams :/",
        color: "red",
        duration: 3000,
        mode: "ios"
      })).present();
      return;
    } else {
      for (let i in this.components) {
        if (this.components[i]._id) {
          this.selected.push({ ...this.components[i], amount: data.amount });
          this.components.splice(+i, 1);
          break;
        }
      }
    }
  }

  async save() {
    this.ui.disableSave = true;
    const result: any = await this.service.post({ components: this.selected, recipee: this.recipee }, "dishes", this.dish._id, "cooking");

    if(result.updated) {
      this.close();
      (await this.toastCtrl.create({
        duration: 4000,
        message: "Successfuly updated.",
        color: "green",
        mode: "ios",
      })).present();
    } else {
      (await this.toastCtrl.create({
        duration: 4000,
        message: "Something went wrong. Try again later.",
        color: "red",
        mode: "ios",
      })).present();
      this.ui.disableSave = false;
    }
  }

  addComponents(comps: Ing[]) {
    this.components = [];
    if(!this.selected || this.selected.length == 0) {
      return this.components.push(...comps);
    }
    for(let i of comps) {
      let add = true;
      for(let j of this.selected) {
        if(i._id == j._id) {
          add = false;
          break;
        }
      }
      if(add) {
        this.components.push(i);
      }
    }
  }

  async ngOnInit() {
    const dishId = this.route.snapshot.paramMap.get("dishId");
    const { cooking, dish, components } = await this.service.get("dishes", dishId, "cooking");

    if (cooking) {
      this.selected = cooking.components;
      this.recipee = cooking.recipee;
    }

    this.addComponents(components);
    this.dish = dish;
  }

}
