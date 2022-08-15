import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { RestaurantService } from '../../services/restaurant.service';
import { UserModalPage } from './user-modal/user-modal.page';

interface Order {
  user: {
    name: string;
    username: string;
    _id: string;
    avatar: any;
  };
  dishes: {
    name: string;
    price: number ;
    _id: string;
  }[]
  date: string;
  status: string;
  total: number;
  _id: string;
  avatar?: string;
  blacklisted: boolean;
  statusColor: "green" | "red" | "purple";
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit {

  orders: Order[];

  constructor(
    private service: RestaurantService,
    private router: RouterService,
    private loader: LoadService,
    private modalCtrl: ModalController,
  ) { };

  goDish(id: string) {
    this.router.go(["restaurant", this.service.restaurantId, "dishes", "full", id], { replaceUrl: true, queryParams: { last: this.router.url } });
  }
  async goUser(id: string) {
    const modal = await this.modalCtrl.create({
      component: UserModalPage,
      mode: "ios",
      cssClass: "modal-width",
      componentProps: {
        userId: id,
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if(data) {
      this.updateOrders();
    }
  }

  async updateOrders() {
    await this.loader.start();
    this.orders = await this.service.get("people", "orders");
    console.log(this.orders);

    for(let i of this.orders) {
      i.avatar = getImage(i.user.avatar) || "./../../../../assets/images/plain-avatar.jpg";
    }
    this.loader.end();
  }

  ngOnInit() {
    this.updateOrders();  
  }

}
