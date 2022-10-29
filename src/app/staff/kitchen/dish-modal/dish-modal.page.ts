import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { MainService } from 'src/app/services/main.service';
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
  comment: string;
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
  _id: string;
  comment: string;
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

  ui: UserInterface;
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
  timeout: any;
  subscription: Subscription;
  userId: string;

  constructor(
    private service: StaffService,
    private modalCtrl: ModalController,
    private kitchen: KitchenService,
    private toastCtrl: ToastController,
    private main: MainService,
    private alertCtrl: AlertController,
  ) { };

  @Input() orderDishId: string;
  @Input() orderId: string;

  close() {
    this.modalCtrl.dismiss();
  }
  async done() {
    const result: any = await this.service.delete("kitchen", this.orderId, "dish", this.orderDishId, "done");

    this.modalCtrl.dismiss(null, result.success ? "done" : null);
  }


  async quit() {
    const result: any = await this.service.delete("kitchen", this.orderId, "dish", this.orderDishId, "quit");

    this.modalCtrl.dismiss(null);
  }

  async take() {
    try {
      const result: any = await this.service.post({}, "kitchen", this.orderId, "dish", this.orderDishId, "take");
      
      if(result.success) {
        this.getTakenInfo(result.taken);
      } else {
        (await this.toastCtrl.create({
          duration: 1500,
          color: "red",
          mode: "ios",
          message: "Something went wrong. Please try again.",
        })).present();
      }
    } catch (e) {
      if(e.status == 403) {
        if(e.body.reason == "taken") {
          (await this.toastCtrl.create({
            duration: 2000,
            color: "red",
            mode: "ios",
            message: "This dish is already taken. Please reload your page."
          }));
          location.reload();
        }
      }
    }
  }
  async getTakenInfo(data: Taken) {
    this.taken = data;
    this.ui.taken = true;
    this.cookAvatar = getImage(this.taken.user.avatar);

    if(this.taken.time) {
      this.timeout = setTimeout(() => {
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

  async doneTaken() {
    const alert = await this.alertCtrl.create({
      header: `Taken by ${this.taken.user.name}`,
      subHeader: `Are you sure it's the dish you're cooking?`,
      mode: "ios",
      buttons: [
        {
          role: "cancel",
          text: "Cancel"
        },
        {
          role: "done",
          text: "DONE"
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();


    if(role == "done") {
      this.done();
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

      this.userId = this.main.user._id;


      if(this.dish.image) {
        this.dishImage = getImage(this.dish.image.binary);
      }
      if(this.user.avatar) {
        this.userAvatar = getImage(this.user.avatar);
      }
      if(this.taken && this.taken.user && this.taken.user.avatar) {
        this.cookAvatar = getImage(this.taken.user.avatar);
      }
      

      this.subscription = this.kitchen.flow.subscribe(res => {
        if(res.type == "kitchen/dish/take") {
          if((res.data as any).orderDishId == this.orderDishId) {
            this.getTakenInfo((res.data as any).taken);
          }
        } else if(res.type == "kitchen/dish/done") {
          if((res.data as any).orderDishId == this.orderDishId) {
            this.modalCtrl.dismiss(null, "done");
          }
        } else if(res.type == "kitchen/dish/quitted") {
          if((res.data as any).orderDishId == this.orderDishId) {
            this.taken = null;
            this.ui.taken = false;
          }
        }
      });

      if(this.ui.taken && this.taken.time) {
        this.timeout = setTimeout(() => {
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
        this.timeout = setTimeout(() => {
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

  fullOrder() {
    
  }

  ngOnDestroy(): void {
    clearInterval(this.takenInterval);
    clearInterval(this.orderedInterval);
    clearTimeout(this.timeout);
    if(this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
