import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { types1, types2 } from 'src/assets/consts';
import { getImage } from 'src/functions';
import { Dish } from 'src/models/dish';
import { Restaurant } from 'src/models/radmin';
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

  types = types1;
  types2 = types2;

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
      types: new FormControl(null),
      time: new FormControl(null, Validators.required),
      price: new FormControl(null, Validators.required),
      description: new FormControl(""),
      categories: new FormControl(null, Validators.required)
    });
  };

  exit() {
    this.router.navigate(["radmin", "dishes", "overview"], { replaceUrl: true, queryParams: { restaurant: this.restaurant._id } });
  }
  async edit() {
    const formData = new FormData();

    if(this.imageChanged) {
      formData.append("image", this.dishImage);
    }
    formData.append("body", JSON.stringify(this.addDishForm.value));

    await this.service.patch(formData, "dish", "update", this.restaurant.sname, this.dish._id)
    this.router.navigate(["radmin", "dishes", "full", this.dish._id], { replaceUrl: true, queryParams: { restaurant: this.restaurant._id } });
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
    const { name, price, time, description, types, categories } = this.addDishForm.value;

    if (
      !this.addDishForm.valid
    ) {
      this.ui.msg = "Some required fields are not filled";
      return;
    }


    const dish = new FormData();
    dish.append("body", JSON.stringify({
      name, price, time, description, types, categories: !categories ? [] : categories
    }));
    if(this.dishImage) {
      dish.append("image", this.dishImage, this.dishImage.name);
    }

    await this.service.post(dish, 'addDish', this.restaurant.sname);

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
    const restaurant = this.route.snapshot.queryParamMap.get("restaurant");
    const { restaurant: r }  = await this.service.get('getRestaurant', 'settings', restaurant);
    this.restaurant = r;
    if(this.mode == "edit") {
      const id = this.route.snapshot.queryParamMap.get("dish");
      if(!id) {
        return this.exit();
      }
      this.dish = await this.service.get("dish", "full", this.restaurant.sname, id);
      this.ui.title = "Edit " + this.dish.name;
      this.image = await getImage(this.dish.image);
      this.addDishForm = new FormGroup({
        name: new FormControl(this.dish.name),
        types: new FormControl(this.dish.types),
        time: new FormControl(this.dish.time),
        price: new FormControl(this.dish.price),
        description: new FormControl(this.dish.description),
        categories: new FormControl(this.dish.categories)
      });
    } else {
      this.ui.title = "Add new dishes to " + this.restaurant.name;
    }
  }

}
