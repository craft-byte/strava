import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { Time } from 'server/src/models/components';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';
import { SoloService } from '../../solo.service';
import { Subscription } from "rxjs";
import { WaiterData } from 'server/src/models/messages';



interface OrderInfo {
    type: "in" | "out";
    number: string;
    comment: string;
    customer: User;
}; interface User {
    name: string;
    avatar: any;
    _id: string;
}; interface Response {
    dish: {
        comment: string;
        cook: User;
        ordered: Time;
        timeDone: Time;
    }
    order: OrderInfo;
};

interface OrderDish {
    dishId: string;
    _id: string;
    id: string;
    orderId: string;
    
    cooked?: {
        time: any;
        user: {
            name: string;
            avatar: any;
            _id: string;
        };
    }
}


@Component({
    selector: 'app-dish-modal',
    templateUrl: './dish-modal.component.html',
    styleUrls: ['./dish-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule],
})
export class DishModalComponent implements OnInit, OnDestroy {

    image: string;
    customerAvatar: string;
    cookAvatar: string;

    interval1: any;
    interval2: any;
    subscription: Subscription;

    dish: any;

    orderDishInfo: Response["dish"];
    order: OrderInfo;

    constructor(
        private s: SoloService,
        private service: StaffService,
        private toastCtrl: ToastController
    ) { };

    @Input() orderDish: OrderDish;
    @Output() leave = new EventEmitter();


    async served() {
        const result: any = await this.service.delete("waiter", "order", this.orderDish.orderId, "dish", this.orderDish._id, "served");

        if(result.success) {
            this.leave.emit(true);
            (await this.toastCtrl.create({
                duration: 1500,
                color: "green",
                mode: "ios",
                message: `${this.dish.name} is served!`,
            })).present();
        } else {
            (await this.toastCtrl.create({
                duration: 2000,
                color: "red",
                mode: "ios",
                message: `Something went wrong. Please try again.`,
            })).present();
        }
    }

    showImage() {
        
    }

    async ngOnInit() {
        this.dish = this.s.dishes[this.orderDish.dishId];
        
        this.image = getImage(this.dish?.image?.binary);

        const result: Response = await this.service.get("waiter", "order", this.orderDish.orderId, "dish", this.orderDish._id);

        this.orderDishInfo = result.dish;
        this.order = result.order;

        if(result.dish?.cook?.avatar) {
            this.cookAvatar = getImage(result.dish.cook.avatar);
        }
        if(result.order?.customer?.avatar) {
            this.customerAvatar = getImage(result.order.customer.avatar);
        }

        this.subscription = this.s.waiter.subscribe(async res => {
            const { type } = res;


            if (type == "dish/served") {
                const { _id, dishId } = res.data as WaiterData.Dish;

                if(this.orderDish._id == _id) {
                    this.leave.emit(true);
                    (await this.toastCtrl.create({
                        duration: 1500,
                        message: `This dish (${this.dish.name}) was just served!`,
                        color: "green",
                        mode: "ios",
                    })).present();
                }
            }
        });

        setTimeout(() => {
            this.orderDishInfo.ordered.minutes++;
            if(this.orderDishInfo.ordered.minutes == 60) {
                this.orderDishInfo.ordered.minutes = 0;
                this.orderDishInfo.ordered.hours++;
            }
            this.interval1 = setInterval(() => {
                this.orderDishInfo.ordered.minutes++;
                if(this.orderDishInfo.ordered.minutes == 60) {
                    this.orderDishInfo.ordered.minutes = 0;
                    this.orderDishInfo.ordered.hours++;
                }
            }, 60000);
        }, this.orderDishInfo.ordered.nextMinute);

        setTimeout(() => {
            this.orderDishInfo.timeDone.minutes++;
            if(this.orderDishInfo.timeDone.minutes == 60) {
                this.orderDishInfo.timeDone.minutes = 0;
                this.orderDishInfo.timeDone.hours++;
            }
            this.interval2 = setInterval(() => {
                this.orderDishInfo.timeDone.minutes++;
                if(this.orderDishInfo.timeDone.minutes == 60) {
                    this.orderDishInfo.timeDone.minutes = 0;
                    this.orderDishInfo.timeDone.hours++;
                }
            }, 60000);
        }, this.orderDishInfo.timeDone.nextMinute);
    }

    ngOnDestroy(): void {
        clearInterval(this.interval1);
        clearInterval(this.interval2);
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
