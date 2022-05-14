import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { strict, general, categories } from 'src/assets/consts';
import { getImage } from 'src/functions';
import { Dish } from 'src/models/dish';
import { Restaurant } from 'src/models/general';
import { RadminService } from '../radmin.service';
import { ImageCropperModalPage } from './image-cropper-modal/image-cropper-modal.page';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.page.html',
  styleUrls: ['./dish.page.scss'],
})
export class DishPage implements OnInit {
  restaurant: Restaurant;

  mode: "edit" | "add";
  imageClass: string = "r1";

  imageChanged = false;

  dish: Dish;
  resolution = "1";
  currentResolution: string;

  addDishForm: FormGroup;

  strict = strict;
  categories = categories;
  general = general;

  dishImage: File;
  image: any = "./../../../../assets/images/no-image.jpg";

  ui = {
    title: "",
    msg: "",
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RadminService,
    private sanitizer: DomSanitizer,
    private modalCtrl: ModalController
  ) {
    this.addDishForm = new FormGroup({
      name: new FormControl("", Validators.required),
      time: new FormControl(null, Validators.required),
      price: new FormControl(null, Validators.required),
      description: new FormControl(""),
      general: new FormControl(null, Validators.required),
      categories: new FormControl(null, Validators.required),
      strict: new FormControl(null, Validators.required)
    });
  };

  exit() {
    if (this.mode == "edit") {
      this.router.navigate(["restaurant", this.restaurant._id, "dishes", "full", this.dish._id], { replaceUrl: true });
    } else {
      this.router.navigate(["restaurant", this.restaurant._id, "dishes", "overview"], { replaceUrl: true });
    }
  }
  async edit() {

    const body = this.addDishForm.value;

    if(this.imageChanged) {
      body.image = { data: this.image.changingThisBreaksApplicationSecurity, resolution: Number(this.currentResolution) };
    }

    body.price = body.price * 100;

    await this.service.patch(body, "dishes", this.dish._id)
    this.router.navigate(["restaurant", this.restaurant._id, "dishes", "full", this.dish._id], { replaceUrl: true });
  }
  async setImage(e: any) {
    this.imageChanged = true;
    const file: File = e.target.files.item(0);
    
    const strs = file.name.split(".");

    

    if (!file || !["jpg", "jpeg", "JPG", "JPEG", "jfif", "svg"].includes(strs[strs.length - 1])) {
      console.log("UNSUPPORTED FILE EXTENSION");
      return;
    }

    const modal = await this.modalCtrl.create({
      component: ImageCropperModalPage,
      mode: "ios",
      cssClass: "image-cropper",
      componentProps: {
        file: file,
        resolution: this.resolution
      }
    });

    
    await modal.present();

    const { data } = await modal.onDidDismiss();
    
    if(data) {
      this.image = this.sanitizer.bypassSecurityTrustUrl(data.image);
      this.currentResolution = data.resolution;
    }
  }

  resolutionChange(e) {
    this.resolution = e.target.value;
    if(this.resolution === "1") {
      this.imageClass = "r1";
    } else if(this.resolution === "1.33") {
      this.imageClass = "r2"
    } else {
      this.imageClass = "r3";
    }
  }

  async addDish(reroute: boolean) {

    if (
      !this.addDishForm.valid
    ) {
      this.ui.msg = "Some required fields are not filled";
      return;
    }

    await this.service.post({ ...this.addDishForm.value, price: this.addDishForm.value.price * 100, image: { resolution: Number(this.currentResolution), data: this.image.changingThisBreaksApplicationSecurity } }, 'dishes');


    if (reroute) {
      this.exit();
      return;
    }

    this.addDishForm.reset();
    this.image = "./../../../../assets/images/no-image.jpg";
  }

  async ngOnInit() {
    this.mode = this.route.snapshot.paramMap.get("mode") as "add" | "edit";
    const restaurantId = this.route.snapshot.paramMap.get("restaurantId");
    this.restaurant = await this.service.getRestaurant(restaurantId);
    if (this.mode == "edit") {
      const id = this.route.snapshot.queryParamMap.get("dish");
      if (!id) {
        return this.exit();
      }
      this.dish = await this.service.get("dishes", id);
      this.ui.title = "Edit " + this.dish.name;
      if(this.dish.image) {
        this.image = this.sanitizer.bypassSecurityTrustUrl((this.dish as any).image);
        if(this.dish.image.resolution) {
          this.resolution = this.dish.image.resolution.toString();
          this.resolutionChange({ target: { value: this.dish.image.resolution }});
        }
      }
      this.addDishForm = new FormGroup({
        name: new FormControl(this.dish.name),
        time: new FormControl(this.dish.time),
        price: new FormControl(this.dish.price),
        description: new FormControl(this.dish.description),
        strict: new FormControl(this.dish.strict),
        general: new FormControl(this.dish.general),
        categories: new FormControl(this.dish.categories)
      });
    } else {
      this.ui.title = "Add new dishes to " + this.restaurant.name;
    }
  }

}
