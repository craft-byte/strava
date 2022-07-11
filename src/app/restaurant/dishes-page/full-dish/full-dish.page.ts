import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { getImage } from 'src/functions';
import { RestaurantService } from '../../services/restaurant.service';

interface ConvertedDish {
  name: string;
  price: string;
  image: { binary: any; resolution: number; };
  _id: string;
  time: string;
  description: string;
  cooking: any;
}

@Component({
  selector: 'app-full-dish',
  templateUrl: './full-dish.page.html',
  styleUrls: ['./full-dish.page.scss'],
})
export class FullDishPage implements OnInit {

  dish: ConvertedDish;
  image: string;
  imageClass = "r1";

  constructor(
    private service: RestaurantService,
    private route: ActivatedRoute,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) { };

  back() {
    const last = this.route.snapshot.queryParamMap.get("last");
    if(last) {
      return this.router.navigate([last], { replaceUrl: true });
    }
    this.router.navigate(["restaurant", this.service.restaurantId, "dishes", "list"], { replaceUrl: true });
  }
  edit() {
    this.router.navigate(["dish", this.service.restaurantId, "edit", this.dish._id], { replaceUrl: true });
  }
  cooking() {
    this.router.navigate(["cooking", this.service.restaurantId, this.dish._id], { replaceUrl: true });
  }
  component(id: string) {
    this.router.navigate(["restaurant", this.service.restaurantId, "components", ""], { replaceUrl: true });
  }

  async remove() {
    const alert = await this.alertCtrl.create({
      header: "Please, be certain.",
      subHeader: "Are you sure you want to delete the dish?",
      mode: "ios",
      buttons: [
        {
          text: "Cancel"
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
      const result: any = await this.service.delete("dishes", this.dish._id);

      if(result.removed) {
        this.router.navigate(["restaurant", this.service.restaurantId, "dishes", "list"], { replaceUrl: true });
        (await this.toastCtrl.create({
          duration: 4000,
          color: "green",
          message: "Successfuly removed.",
          mode: "ios"
        })).present();
      } else {
        (await this.toastCtrl.create({
          duration: 4000,
          color: "red",
          message: "Something went wrong. Try again later.",
          mode: "ios"
        })).present();
      }
    }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get("dishId");
    this.dish = await this.service.get("dishes", id);
    this.image = getImage(this.dish.image.binary);

    if(this.dish.image.resolution == 1) {
      this.imageClass = "r1";
    } else if(this.dish.image.resolution == 1.33) {
      this.imageClass = "r2";
    } else {
      this.imageClass = "r3";
    }
  }

}
