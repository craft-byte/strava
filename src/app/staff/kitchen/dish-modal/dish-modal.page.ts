import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { getImage } from 'src/functions';
import { StaffService } from '../../staff.service';
import { KitchenService } from '../kitchen.service';


interface Taken {
  time: {
    hours: number;
    minutes: number;
    nextMinute: number;
    color: string;
  };
  user: {
    avatar: any;
    name: string;
    _id: string;
  }
}
interface Order {
  table: number;
  dishes: string;
  _id: string;
  time: {
    hours: number;
    minutes: number;
    nextMinute: number;
    color: string;
  }
}
interface User {
  avatar: any;
  name: string;
  socketId: string;
  _id: string;
};
interface Dish {
  name: string;
  time: number;
  image: {
    binary: any;
    resolution: string;
  }
};
interface UserInterface {
  showComponents: boolean;
  showRecipee: boolean;
  showUser: boolean;
  taken: boolean;
};
interface Cooking {
  recipee: string;
  components: {
    name: string;
    _id: string;
    amount: number;
    of: number;
  }[]
}
interface Response {
  ui: UserInterface
  dish: Dish;
  user: User;
  order: Order;
  cooking: Cooking;
  taken: Taken;
}

@Component({
  selector: 'app-dish-modal',
  templateUrl: './dish-modal.page.html',
  styleUrls: ['./dish-modal.page.scss'],
})
export class DishModalPage implements OnInit, OnDestroy {

  ui: UserInterface = {
    showComponents: false,
    showRecipee: false,
    showUser: false,
    taken: false,
  };;
  dish: Dish;
  order: Order;
  cooking: Cooking;
  user: User;
  taken: Taken;

  dishImage: string;
  userAvatar: string;
  cookAvatar: string;


  takenInterval: any;
  orderedInterval: any;
  subscription: Subscription;

  constructor(
    private service: StaffService,
    private modalCtrl: ModalController,
    private kitchen: KitchenService,
  ) { };

  @Input() orderDishId: string;
  @Input() orderId: string;

  close() {
    this.modalCtrl.dismiss();
  }
  done() {
    this.kitchen.emit("kitchen/dish/done", { orderId: this.orderId, orderDishId: this.orderDishId });

    this.modalCtrl.dismiss(null, "done");
  }


  take() {
    this.kitchen.emit("kitchen/dish/take", { orderId: this.orderId, orderDishId: this.orderDishId });
    
    this.getTakenInfo();
  }
  async getTakenInfo() {
    const result: Taken = await this.service.get("kitchen/taken");

    if(!result) {
      return;
    }

    this.taken = result;
    this.ui.taken = true;
    this.cookAvatar = getImage(this.taken.user.avatar);

    if(this.taken.time) {
      setTimeout(() => {
        this.taken.time.minutes ++;
        if(this.taken.time.minutes == 60) {
          this.taken.time.minutes = 0;
          this.taken.time.hours++;
        }
        this.takenInterval = setInterval(() => {
          this.taken.time.minutes++
          if(this.taken.time.minutes == 60) {
            this.taken.time.minutes = 0;
            this.taken.time.hours++;
          }
        }, 60000);
      }, this.taken.time.nextMinute);
    }
  }

  async ngOnInit() {
    try {
      const result: Response = await this.service.get("kitchen", this.orderId, "dish", this.orderDishId, "info");
      const { ui, dish, order, user, cooking, taken } = result;


      this.ui = ui;
      this.dish = dish;
      this.order = order;
      this.taken = taken;
      this.cooking = cooking;
      this.user = user;


      if(this.dish.image) {
        this.dishImage = getImage(this.dish.image.binary);
      }
      if(this.user.avatar) {
        this.userAvatar = getImage(this.user.avatar);
      }
      if(this.taken && this.taken.user && this.taken.user.avatar) {
        this.cookAvatar = getImage(this.taken.user.avatar);
      }
      

      this.subscription = this.kitchen.listen().subscribe(res => {
        if(res.type == "kitchen/dish/take") {
          if((res.data as any).orderDishId == this.orderDishId) {
            this.getTakenInfo();
          }
        } else if(res.type == "kitchen/dish/done") {
          if((res.data as any).orderDishId == this.orderDishId) {
            this.modalCtrl.dismiss(null, "done");
          }
        }
      });

      if(this.ui.taken && this.taken.time) {
        setTimeout(() => {
          this.taken.time.minutes ++;
          if(this.taken.time.minutes == 60) {
            this.taken.time.minutes = 0;
            this.taken.time.hours++;
          }
          this.takenInterval = setInterval(() => {
            this.taken.time.minutes++
            if(this.taken.time.minutes == 60) {
              this.taken.time.minutes = 0;
              this.taken.time.hours++;
            }
          }, 60000);
        }, this.taken.time.nextMinute);
      }
      if(this.order.time) {
        setTimeout(() => {
          this.order.time.minutes ++;
          if(this.order.time.minutes == 60) {
            this.order.time.minutes = 0;
            this.order.time.hours++;
          }
          this.orderedInterval = setInterval(() => {
            this.order.time.minutes++
            if(this.order.time.minutes == 60) {
              this.order.time.minutes = 0;
              this.order.time.hours++;
            }
          }, 60000);
        }, this.order.time.nextMinute);
      }
    } catch (e) {
      if(e == 404) {
        this.modalCtrl.dismiss(null, "restart");
      } else if(e == 401) {
        this.modalCtrl.dismiss();
      }
    }

  }

  ngOnDestroy(): void {
    clearInterval(this.takenInterval);
    clearInterval(this.orderedInterval);
    this.subscription.unsubscribe();
  }

}
