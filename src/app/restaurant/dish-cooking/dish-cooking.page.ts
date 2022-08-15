import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from '../services/restaurant.service';
import { AddIngredientPage } from './add-ingredient/add-ingredient.page';
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
  recipee: string;
  selected: Ing[] = [];

  timeout: any;

  ui = {
    disableSaveRecipee: true,
  };

  constructor(
    private route: ActivatedRoute,
    public service: RestaurantService,
    private router: RouterService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private loader: LoadService,
  ) { };

  close() {
    this.router.go(["restaurant", this.service.restaurantId, "dishes", "full", this.dish._id], { replaceUrl: true });
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
            const amount = this.selected[i].amount;
            this.selected[i].amount = d.amount;
            const result: any = await this.service.patch({ amount: d.amount }, "dishes", this.dish._id, "cooking/component", comp._id);

            if(!result.updated) {
              this.selected[i].amount = amount;
              (await this.toastCtrl.create({
                duration: 2000,
                color: "red",
                message: "Couldn't update component amount. Please, try again later.",
                mode: "ios",
              })).present();
            }
          }
        }
      } else if (d.type == 2) {
        for (let i in this.selected) {
          if (this.selected[i]._id == comp._id) {
            const el = this.selected.splice(+i, 1);
            const result: any = await this.service.delete("dishes", this.dish._id, "cooking/component", comp._id);
            if(!result.removed) {
              this.selected.splice(+i, 0, el[0]);
              (await this.toastCtrl.create({
                color: "red",
                message: "Something went wrong. Try again later.",
                mode: "ios",
                duration: 2000
              })).present();
            }
            break;
          }
        }
      }
    }
  }



  onInput(event: any) {
    const { target: { value } } = event;

    this.ui.disableSaveRecipee = false;
    this.recipee = value;
  }
  async save() {
    this.ui.disableSaveRecipee = true;
    const result: any = await this.service.post({ recipee: this.recipee }, "dishes", this.dish._id, "cooking/recipee");

    if(result.updated) {
      (await this.toastCtrl.create({
        duration: 1500,
        message: "Successfuly updated.",
        color: "green",
        mode: "ios",
      })).present();
    } else {
      (await this.toastCtrl.create({
        duration: 1500,
        message: "Something went wrong. Try again later.",
        color: "red",
        mode: "ios",
      })).present();
      this.ui.disableSaveRecipee = false;
    }
  }


  async add() {
    const modal = await this.modalCtrl.create({
      component: AddIngredientPage,
      mode: "ios",
      cssClass: "modal-width",
      id: "add",
      componentProps: {
        dishName: this.dish.name,
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if(data) {
      this.selected.push({ _id: data.id, amount: data.amount, name: data.name });

      const update: any = await this.service.post({ componentId: data.id, amount: data.amount }, "dishes", this.dish._id, "cooking/component");

      if(!update.updated) {
        for(let i in this.selected) {
          if(this.selected[i]._id == data.id) {
            this.selected.splice(+i, 1);
            break;
          }
        }
        (await this.toastCtrl.create({
          duration: 2000,
          color: "red",
          mode: "ios",
          message: "Couldn't add component. Please, try again later.",
        })).present();
      }

    }
  }







  async ngOnInit() {
    await this.loader.start();
    const dishId = this.route.snapshot.paramMap.get("dishId");
    const { cooking, dish } = await this.service.get("dishes", dishId, "cooking");

    if (cooking) {
      this.selected = cooking.components || [];
      this.recipee = cooking.recipee;
    }

    this.dish = dish;
    this.service.currentDish = dish;

    this.loader.end();
  }

}
