import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { KitchenDish } from 'src/models/kitchen';
import { Restaurant } from 'src/models/general';
import { StaffService } from '../../staff.service';
import { DepartmentModalPage } from '../department-modal/department-modal.page';
import { DishPage } from '../dish-modal/dish-modal.page';
import { KitchenService } from '../kitchen.service';

@Component({
  selector: 'app-kitchen',
  templateUrl: './kitchen.page.html',
  styleUrls: ['./kitchen.page.scss'],
})
export class KitchenPage implements OnInit, OnDestroy {

  updateInterval: any;
  subscription: Subscription;

  restaurant: Restaurant = { _id: null };
  userId: string;

  convertedDishes: any[] = [];

  ui = {
    title: "Ctraba"
  }

  constructor(
    private route: ActivatedRoute,
    private service: StaffService,
    private alertCtrl: AlertController,
    public kitchen: KitchenService,
    private router: Router,
    private modalCtrl: ModalController
  ) { };

  close() {
    this.router.navigate(["staff", this.restaurant._id, "dashboard"], { queryParamsHandling: "preserve" });
  }

  async login() {

    this.restaurant._id = this.route.snapshot.paramMap.get("restaurantId");

    const result = await this.service.get<{
      restaurant: Restaurant;
      dishes: KitchenDish[];
      userId: string;
      convertedDishes: any[];
    } |
    { error: string }
    >("kitchen", this.restaurant._id, "init");



    if (result.hasOwnProperty("error")) {
      const alert = await this.alertCtrl.create({
        header: "Error",
        message: "You are not allowed to enter this page.",
        backdropDismiss: false
      });

      return alert.present();
    }

    const { restaurant, convertedDishes, dishes, userId } = result as {
      restaurant: Restaurant;
      dishes: any;
      userId: string;
      convertedDishes: any[];
    };

    this.service.restaurantId = restaurant._id;
    this.restaurant = restaurant;
    this.userId = userId;

    this.kitchen.dishes = dishes;
    this.kitchen.convertedDishes = convertedDishes;

    this.ui.title = restaurant.name;

    return true;
  }

  async go(c?: string) {

    if(!this.service.restaurantId) {
      return;
    }

    let color = "red";
    let title = "Ctraba";

    switch (c) {
      case "a":
        color = "orange";
        title = "Appetizers";
        break;
      case "sa":
        color = "green";
        title = "Salads";
        break;
      case "d":
        color = "pink";
        title = "Desserts";
        break;
      case "e":
        title = "Entrees";
        break;
      case "si":
        color = "purple";
        title = "Sides";
        break;
      case "so":
        color = "blue";
        title = "Soups";
        break;
      case "b":
        color = "sea";
        title = "Beverages";
        break;
    }

    const modal = await this.modalCtrl.create({
      component: DepartmentModalPage,
      mode: "ios",
      swipeToClose: true,
      cssClass: "department-modal",
      componentProps: {
        title,
        color,
        type: c
      }
    });

    await modal.present();
  }

  async onDishEmitted(data: any) {
    const modal = await this.modalCtrl.create({
      component: DishPage,
      swipeToClose: true,
      cssClass: "department-modal",
      componentProps: {
        orderDish: data.orderDish,
        dish: data.dish
      },
      mode: "ios"
    });

    await modal.present();

    modal.present();
  }

  async ngOnInit() {
    const result = await this.login();

    if(!result) {
      return;
    }

    this.subscription = this.kitchen.connect(this.restaurant._id, this.userId).subscribe(res => {
      const { type, data } = res;

      if(type == "kitchen/order/new") {

        for(let i of data) {
          this.kitchen.dishes[i.type.value].push(i);
        }

      }

    });

    this.updateInterval = setInterval(async () => {
      this.kitchen.dishes = await this.service.get(`kitchen/${this.service.restaurantId}/dishes/all`);
    }, 60000);
  }

  ngOnDestroy(): void {
    clearInterval(this.updateInterval);
    this.subscription.unsubscribe();
  }

}