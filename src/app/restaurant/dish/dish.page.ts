import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { strict, general, categories } from 'src/assets/consts';
import { getImage } from 'src/functions';
import { Dish } from 'src/models/dish';
import { Restaurant } from 'src/models/general';
import { RadminService } from '../radmin.service';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.page.html',
  styleUrls: ['./dish.page.scss'],
})
export class DishPage implements OnInit {

  restaurant: Restaurant;

  mode: "edit" | "add";

  imageChanged = false;

  dish: Dish;

  addDishForm: FormGroup;

  strict = strict;
  categories = categories;
  general = general;

  dishImage: File;
  image = "./../../../../assets/images/no-image.jpg";

  ui = {
    title: "",
    msg: ""
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RadminService
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
    if(this.mode == "edit") {
      this.router.navigate(["restaurant", this.restaurant._id, "dishes", "full", this.dish._id], { replaceUrl: true });
    } else {
      this.router.navigate(["restaurant", this.restaurant._id, "dishes", "overview"], { replaceUrl: true });
    }
  }
  async edit() {
    const formData = new FormData();

    if(this.imageChanged) {
      formData.append("image", this.dishImage);
    }
    formData.append("body", JSON.stringify(this.addDishForm.value));

    await this.service.patch(formData, "dishes", this.dish._id)
    this.router.navigate(["restaurant", this.restaurant._id, "dishes", "full", this.dish._id], { replaceUrl: true });
  }
  async setImage(e) {
    this.imageChanged = true;
    const file: File = e.target.files.item(0);

    const [_name, ext] = file.name.split(".");

    if (!["jpg", "jpeg", "JPG", "JPEG", "jfif", "svg"].includes(ext) || !file) {
      console.log("UNSUPPORTED FILE EXTENSION");
      return;
    }

    this.dishImage = file;

    this.image = await getImage(file);

  }
  async addDish(reroute: boolean) {
    
    if (
      !this.addDishForm.valid
    ) {
      this.ui.msg = "Some required fields are not filled";
      return;
    }
    
    const dish = new FormData();
    dish.append("body", JSON.stringify(this.addDishForm.value));
    if(this.dishImage) {
      dish.append("image", this.dishImage, this.dishImage.name);
    }

    await this.service.post(dish, 'dishes/add');

    if(reroute) {
      this.exit();
      return;
    }

    this.addDishForm.reset();
    this.dishImage = null;
    this.image = "./../../../../assets/images/no-image.jpg";
  }

  async ngOnInit() {
    this.mode = this.route.snapshot.paramMap.get("mode") as "add" | "edit";
    const restaurantId = this.route.snapshot.paramMap.get("restaurantId");
    this.restaurant = await this.service.getRestaurant(restaurantId);
    if(this.mode == "edit") {
      const id = this.route.snapshot.queryParamMap.get("dish");
      if(!id) {
        return this.exit();
      }
      this.dish = await this.service.get("dishes", id);
      this.ui.title = "Edit " + this.dish.name;
      this.image = await getImage(this.dish.image);
      this.addDishForm = new FormGroup({
        name: new FormControl(this.dish.name),
        types: new FormControl(this.dish.types),
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
