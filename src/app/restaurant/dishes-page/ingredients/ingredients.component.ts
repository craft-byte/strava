import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, PopoverController, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RestaurantService } from '../../services/restaurant.service';
import { AddModalPage } from './add-modal/add-modal.page';
import { IngredientPopoverComponent } from './ingredient-popover/ingredient-popover.component';


interface Ing {
  name: string;
  amount: number;
  _id: string;
}


@Component({
  selector: 'app-ingredients',
  templateUrl: './ingredients.component.html',
  styleUrls: ['./ingredients.component.scss'],
})
export class IngredientsComponent implements OnInit {

  components: Ing[];

  constructor(
    private service: RestaurantService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
    private loader: LoadService,
  ) { }

  async add() {
    const modal = await this.modalCtrl.create({
      component: AddModalPage,
      mode: "ios",
      swipeToClose: true,
      cssClass: "modal-width",
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if(data) {
      const result: any = await this.service.post({component: data}, "components");

      if(result.component) {
        this.components.push(result.component);
        (await this.toastCtrl.create({
          duration: 4000,
          color: "green",
          mode: "ios",
          message: "Successfuly added."
        })).present();
      } else {
        (await this.toastCtrl.create({
          duration: 4000,
          color: "red",
          mode: "ios",
          message: "Something went wrong. Try again later."
        })).present();
      }
    }
  }

  async more(e: any, id: string) {
    const popover = await this.popoverCtrl.create({
      component: IngredientPopoverComponent,
      mode: "ios",
      event: e,
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();

    if(data) {
      if(data == 1) {

      } else if(data == 2) {
        // this.edit(id);
      } else {
        this.remove(id);
      }
    }
  }

  async remove(id: string) {
    const alert = await this.alertCtrl.create({
      header: "Please be certain.",
      mode: "ios",
      subHeader: "Are you sure you want to remove the component?",
      buttons: [
        {
          text: "cancel",
        },
        {
          text: "Submit",
          role: "remove"
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();

    if(role == "remove") {
      const result: any = await this.service.delete("components", id);
      if(result.removed) {
        for(let i in this.components) {
          console.log(this.components[i]._id, id);
          if(this.components[i]._id == id) {
            this.components.splice(+i, 1);
            break;
          }
        }
        (await this.toastCtrl.create({
          message: "Successfuly removed.",
          color: "green",
          mode: "ios",
          duration: 4000
        })).present();
      } else {
        (await this.toastCtrl.create({
          message: "Something went wrong. Try again later.",
          color: "red",
          mode: "ios",
          duration: 4000
        })).present();
      }
    }
  }

  go(id: string) {

  }

  async ngOnInit() {
    await this.loader.start();
    this.components = await this.service.get("components");
    this.loader.end();
  }

}
