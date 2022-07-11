import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { categories, general, strict } from 'src/assets/consts';
import { getImage } from 'src/functions';
import { Restaurant } from 'src/models/general';
import { RestaurantService } from '../services/restaurant.service';
import { ImagePage } from './image/image.page';

interface ConvertedDish {
  name: string;
  price: string;
  image: {
    binary: any;
    resolution: number;
  };
  _id: string;
  description: string;
  strict: any;
  general: any;
  categories: any;
  time: number;
}

@Component({
  selector: 'app-dish',
  templateUrl: './dish.page.html',
  styleUrls: ['./dish.page.scss'],
})
export class DishPage implements OnInit {

  restaurant: Restaurant;
  dish: ConvertedDish;
  form: FormGroup;
  mode: "edit" | "add";
  resolution: number = 1;
  imageClass: string = "r1";
  imageFile: File;
  image: string;
  imageUpdated: boolean = false;

  general = general;
  categories = categories;
  strict = strict;

  ui = {
    disableSave: false,
    disableAdd: false
  }

  constructor(
    private service: RestaurantService,
    private route: ActivatedRoute,
    private router: Router,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) { };



  close() {
    if(this.mode == "add") {
      this.router.navigate(["restaurant", this.service.restaurantId, "dishes", "list"], { replaceUrl: true });
    } else {
      this.router.navigate(["restaurant", this.service.restaurantId, "dishes", "full", this.dish._id]);
    }
  }
  async setImage(event: any) {

    this.imageFile = event.target.files.item(0);

    const modal = await this.modalCtrl.create({
      component: ImagePage,
      mode: "ios",
      cssClass: "modal-width",
      swipeToClose: true,
      componentProps: {
        event
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if(data) {
      this.imageUpdated = true;
      this.image = data.image;
      this.resolution = data.resolution;
      if(data.resolution == 1) {
        this.imageClass = "r1";
      } else if(data.resolution == 1.33) {
        this.imageClass = "r2";
      } else {
        this.imageClass = "r3";
      }
    }
  }
  async add(r: boolean) {
    this.ui.disableAdd = true;
    if(!this.form.valid) {
      (await this.toastCtrl.create({
        duration: 2000,
        message: "Fill all given fields.",
        color: "red",
        mode: "ios"
      }))
      return;
    }

    const dish = {
      ...this.form.value,
      image: {
        binary: this.image,
        resolution: this.resolution || 1,
      }
    };

    const result: any = await this.service.post({ dish }, "dishes");

    if(result.added) {
      (await this.toastCtrl.create({
        duration: 2000,
        message: "Successfuly added.",
        color: "green",
        mode: "ios",
      })).present();
      if(r) {
        this.router.navigate(["restaurant", this.service.restaurantId, "dishes", "list"], { replaceUrl: true });
      }
    } else {
      (await this.toastCtrl.create({
        duration: 2000,
        message: "Something went wrong. Try again later.",
        color: "red",
        mode: "ios",
      })).present();
    }
  }
  async save() {
    this.ui.disableSave = true;

    if(!this.form.valid) {
      this.ui.disableSave = false;
      (await this.toastCtrl.create({
        duration: 2000,
        message: "Fill all required fields.",
        color: "red",
        mode: "ios"
      })).present();
      return;
    }

    const body: any = this.form.value;

    if(this.imageUpdated) {
      body.image = { data: this.image, resolution: this.resolution };
    }

    const result: any = await this.service.patch(body, "dishes", this.dish._id);

    if(result.updated) {
      this.router.navigate(["restaurant", this.service.restaurantId, "dishes", "full", this.dish._id], { replaceUrl: true });
      (await this.toastCtrl.create({
        duration: 2000,
        message: "Successfuly updated.",
        color: "green",
        mode: "ios"
      })).present();
    } else {
      this.ui.disableSave = false;
      (await this.toastCtrl.create({
        duration: 2000,
        message: "Something went wrong. Try again later.",
        color: "red",
        mode: "ios"
      })).present();
    }
  }

  async ngOnInit() {
    this.restaurant = this.service.restaurant;
    this.mode = this.route.snapshot.params["mode"] as any;
    if(this.mode != "add" && this.mode as any != "edit") {
      this.router.navigate(["restaurant", this.restaurant._id, "dishes", "list"], { replaceUrl: true });
      return;
    }
    if(this.mode == "add") {
      this.form = new FormGroup({
        name: new FormControl("", Validators.required),
        price: new FormControl(null, Validators.required),
        time: new FormControl(null, Validators.required),
        description: new FormControl(""),
        strict: new FormControl(null),
        categories: new FormControl(null),
        general: new FormControl(null, Validators.required)
      });
    } else {
      const dishId = this.route.snapshot.params["dishId"] as any;
      this.dish = await this.service.get("dishes", dishId);
      this.image = getImage(this.dish.image.binary);
      this.resolution = this.dish.image.resolution;
      if(this.resolution == 1) {
        this.imageClass = "r1";
      } else if(this.resolution == 1.33) {
        this.imageClass = "r2";
      } else {
        this.imageClass = "r3";
      }
      this.form = new FormGroup({
        name: new FormControl(this.dish.name, Validators.required),
        price: new FormControl(this.dish.price, Validators.required),
        time: new FormControl(this.dish.time, Validators.required),
        description: new FormControl(this.dish.description),
        strict: new FormControl(this.dish.strict),
        categories: new FormControl(this.dish.categories),
        general: new FormControl(this.dish.general, Validators.required)
      });
    }
  }

}
