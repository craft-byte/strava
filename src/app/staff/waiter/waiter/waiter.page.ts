import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/services/main.service';
import { Restaurant } from 'src/models/general';
import { StaffService } from '../../staff.service';
import { WaiterService } from '../waiter.service';
import { DishModalPage } from './dish-modal/dish-modal.page';

interface OrderDish {
  orderId: string;
  _id: string;
  dishId: string;
  time: any;
}

@Component({
  selector: 'app-waiter',
  templateUrl: './waiter.page.html',
  styleUrls: ['./waiter.page.scss'],
})
export class WaiterPage implements OnInit {

  restaurant: Restaurant = { _id: null };
  dishes: any[] = [];
  orderDishes: OrderDish[] = [];

  ui = {
    title: "Waiter",
    disableClose: true
  };


  constructor(
    private router: RouterService,
    private loader: LoadService,
    private service: StaffService,
    private route: ActivatedRoute,
    private waiter: WaiterService,
    private main: MainService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) { };


  close() {
    this.router.go(["staff", this.restaurant._id, "dashboard"], { queryParamsHandling: "preserve", replaceUrl: true });
  }

  async login() {
    this.restaurant._id = this.route.snapshot.paramMap.get("restaurantId");
    this.ui.disableClose = false;
    if(!this.restaurant._id) {
      this.router.go([ "user/info" ], { queryParamsHandling: "preserve", replaceUrl: true });
    }

    const result = await this.service.post<{ dishes: any; orderDishes: any; restaurant: Restaurant; }>({ socketId: this.waiter.socketId }, "waiter", "init");


    if(!result) {
      return false;
    }

    const { orderDishes, dishes, restaurant } = result;

    this.restaurant = restaurant;
    this.orderDishes = orderDishes;
    this.dishes = dishes;

    return true;
  }

  // done(id: string) {
  //   for(let i in this.orderDishes) {
  //     if(this.orderDishes[i]._id == id) {
  //       // this.waiter.emit("dish/served", { orderId: this.orderDishes[i].orderId, orderDishId: this.orderDishes[i]._id });
  //       this.orderDishes.splice(+i, 1);
  //       break;
  //     }
  //   }
  // }

  async open(data: OrderDish) {
    const modal = await this.modalCtrl.create({
      component: DishModalPage,
      cssClass: "modal-width",
      mode: "ios",
      componentProps: {
        data
      }
    });

    await modal.present();

    const { data: d, role } = await modal.onDidDismiss();

    if(role == "served") {
      for(let i in this.orderDishes) {
        if(this.orderDishes[i]._id == d) {
          this.orderDishes.splice(+i, 1);
          break;
        }
      }
    }
  }

  async ngOnInit() {
    await this.loader.start();

    const result = await this.login();

    if(!result) {
      this.router.go(["staff", this.restaurant._id, "dashboard"], { replaceUrl: true });
    }


    this.waiter.connect().subscribe(async res => {
      const { type } = res;


      if(type == "waiter/dish/new") {
        const dish = res.data as any;

        this.orderDishes.push(dish);
      } else if(type == "waiter/dish/served") {
        const { orderDishId, dishId } = res.data as any;

        for(let i in this.orderDishes) {
          if(this.orderDishes[i]._id == orderDishId) {
            this.orderDishes.splice(+i, 1);
            (await this.toastCtrl.create({
              mode: "ios",
              color: "green",
              message: `${this.dishes[dishId].name} is served!`,
              duration: 1200,
            }));
            break;
          }
        }
      }
    });
    this.loader.end();
  }

}
