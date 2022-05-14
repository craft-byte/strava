import { StringMapWithRename } from '@angular/compiler/src/compiler_facade_interface';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { getImage } from 'src/functions';
import { Dish } from 'src/models/dish';
import { Restaurant } from 'src/models/general';
import { RadminService } from '../../radmin.service';

@Component({
  selector: 'app-full',
  templateUrl: './full.component.html',
  styleUrls: ['./full.component.scss'],
})
export class FullComponent implements OnInit {

  ui = {
    title: ""
  }
  dish: Dish;
  image: string;
  imageClass: string;
  restaurant: Restaurant;

  constructor(
    private service: RadminService,
    private route: ActivatedRoute,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private s: DomSanitizer
  ) {
  };

  cooking() {
    this.router.navigate(["dish-cooking", this.restaurant._id, this.dish._id], { queryParamsHandling: "preserve", replaceUrl: true });
  }
  back() {
    this.router.navigate(["restaurant", this.restaurant._id, "dishes", "overview"], { queryParamsHandling: "preserve" });
  }
  async remove() {
    const alert = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      mode: "ios",
      header: 'Please be certain.',
      message: 'Once you delete a dish, there is no going back.',
      buttons: [{ text: "Cancel", role: null }, { text: "Remove", role: "remove" }]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();

    if (role == "remove") {
      await this.service.delete('dishes', this.dish._id);
      this.back();
    }
  }
  edit() {
    this.router.navigate(["dish", this.restaurant._id, "edit"], { queryParams: { dish: this.dish._id }, replaceUrl: true, queryParamsHandling: "merge" });
  }
  component(id: string) {
    this.router.navigate(["restaurant", this.restaurant._id, "cooking", "components", "more", id], { replaceUrl: true, queryParamsHandling: "preserve" });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get("id");
    this.restaurant = await this.service.getRestaurant();
    this.dish = await this.service.get<Dish>("dishes", id);
    if (!this.dish) {
      (await this.toastCtrl.create({
        message: "No dish found.",
        color: "orange",
        duration: 4000,
        mode: "ios",
      })).present();
      return this.back();
    }
    if (this.dish.image) {
      if ((this.dish as any).image) {
        this.image = (this.dish as any).image;
      }
      if ((this.dish as any).resolution) {
        if ((this.dish as any).resolution === 1.33) {
          this.imageClass = "r2"
        } else if ((this.dish as any).resolution === 1.77) {
          this.imageClass == "r3";
        } else {
          this.imageClass = "r1";
        }
      }
    } else {
      this.image = "./../../../../assets/images/no-image.jpg";
    }
  }
}
