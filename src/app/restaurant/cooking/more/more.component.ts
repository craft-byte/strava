import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { RadminService } from 'src/app/restaurant/radmin.service';
import { Component as C } from 'src/models/components';
import { Restaurant } from 'src/models/general';
import { EditWindowPage } from '../components/edit-window/edit-window.page';
import { UpdateWindowPage } from '../components/update-window/update-window.page';

@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.scss'],
})
export class MoreComponent implements OnInit {

  restaurant: Restaurant;
  component: C;
  fullType: string;
  windowType: "edit" | "remove" | "add" = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalCtrl: ModalController,
    private service: RadminService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { };


  back() {
    this.router.navigate(["restaurant", this.service.restaurantId, "cooking", "components"], { replaceUrl: true, queryParamsHandling: "preserve" });
  }

  async edit() {
    const modal = await this.modalCtrl.create({
      component: EditWindowPage,
      cssClass: "department-modal",
      mode: "ios",
      swipeToClose: true,
      componentProps: {
        component: this.component
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if(data) {
      const result: any = await this.service.patch({ updated: data }, "components/edit", this.component._id);

      if(result.modifiedCount > 0) {
        this.component.name = data.name;
        this.component.amount = data.amount;
        this.component.price = data.price;

        (await this.toastCtrl.create({
          duration: 4000,
          message: "Successfuly updated.",
          mode: "ios",
          color: "green"
        })).present();
      } else {
        (await this.toastCtrl.create({
          duration: 4000,
          message: "Something went wrong. Try again later.",
          mode: "ios",
          color: "red"
        })).present();
      };
    }

  }

  async update() {
    const modal = await this.modalCtrl.create({
      component: UpdateWindowPage,
      cssClass: "department-modal",
      mode: "ios",
      swipeToClose: true,
      componentProps: {
        name: this.component.name,
        warning: this.component.warning
      },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if(data) {
      const body: any = { amount: data.amount };
      if(this.component.warning != data.warning) {
        body.warning = data.warning;
      }
      
      const result: any = await this.service.patch(body, "components/update", this.component._id);

      if(result.modifiedCount > 0) {
        this.component.amount += body.amount || 0;
        this.component.warning = body.warning;

        (await this.toastCtrl.create({
          duration: 4000,
          message: "Updated successfuly.",
          color: "green",
          mode: "ios"
        })).present();
      } else {
        (await this.toastCtrl.create({
          duration: 4000,
          message: "Something went wrong. Try again later.",
          color: "red",
          mode: "ios"
        })).present();
      }
    }
  }

  async remove() {
    
    const alert = await this.alertCtrl.create({
      header: "Be certain.",
      message: "Are you sure you want to delete the component?",
      mode: "ios",
      buttons: [
        {
          text: "Cancel",
          role: "cancel"
        },
        {
          text: "Submit",
          role: "submit"
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();

    if(role == "submit") {
      const result: any = await this.service.delete("components", this.component._id);

      if(result.acknowledged) {
        this.back();
        (await this.toastCtrl.create({
          duration: 4000,
          message: "Successfuly removed.",
          mode: "ios",
          color: "green"
        })).present();
      } else {
        (await this.toastCtrl.create({
          duration: 4000,
          message: "Something went wrong. Try again later.",
          mode: "ios",
          color: "red"
        })).present();
      }
    }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get("id");
    this.restaurant = await this.service.getRestaurant();
    this.component = await this.service.get("components/get", id);
  }

}
