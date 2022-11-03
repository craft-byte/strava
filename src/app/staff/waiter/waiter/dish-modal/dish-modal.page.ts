import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';


interface Dish {
    _id: string;
    name: string;
    image: {
        binary: any;
        resolution: number;
    }
}
interface Order {
    type: "order" | "table";
    number: number;
}
interface User {
    name: string;
    username: string;
    avatar: { binary: any; };
}
interface Time {
    hours: number;
    minutes: number;
    nextMinute: number;
    color: string;
}
interface RequestResult {
    comment: string;
    cook: User;
    dish: Dish;
    time: Time;
    timeDone: Time;
    user: User;
    order: Order;
}


@Component({
    selector: 'dish-modal-page',
    templateUrl: './dish-modal.page.html',
    styleUrls: ['./dish-modal.page.scss'],
})
export class DishModalPage implements OnInit, OnDestroy {

    id: string;
    title: string;

    dish: Dish;
    comment: string;
    dishImage: string;
    imageClass = "r1";

    time: Time;
    timeDone: Time;

    cook: User;
    cookName: string;
    cookShowDots: boolean;
    cookAvatar: string;
    user: User;
    userShowDots: boolean;
    userName: string;
    userAvatar: string;

    interval1: any;
    interval2: any;

    constructor(
        private modalCtrl: ModalController,
        private service: StaffService,
        private toastCtrl: ToastController,
    ) { };

    @Input() data: {
        orderId: string;
        _id: string;
        dishId: string;
        time: any;
    }

    close() {
        this.modalCtrl.dismiss(false);
    }

    async served() {
        const result: any = await this.service.delete("waiter", "order", this.data.orderId, "dish", this.data._id, "served");

        if(result.success) {
            this.modalCtrl.dismiss(this.data._id, "served");
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


    async ngOnInit() {
        try {
            const result: RequestResult = await this.service.get("waiter", this.data.orderId, "dish", this.data._id);
     
            
            const { comment, user, time, timeDone, dish, cook, order } = result;

            this.dish = dish;
            this.comment = comment;
            this.cook = cook;
            this.user = user;
            this.time = time;
            this.timeDone = timeDone;

            this.id = (this.data._id).slice(this.data._id.length - 4, this.data._id.length);
            this.title = `${(order.type[0]).toUpperCase()}${order.type.slice(1)} #${order.number}`;
            
            this.cookAvatar = getImage(cook?.avatar?.binary);
            this.userAvatar = getImage(user?.avatar?.binary);
            
            this.dishImage = getImage(dish?.image?.binary);

            if((cook.name || cook.username).length > 11) {
                this.cookName = (cook.name || cook.username).slice(0, 12);
                this.cookShowDots = true;
            }
            if((user.name || user.username).length > 11) {
                this.userName = (user.name || user.username).slice(0, 12);
                this.userShowDots = true;
            }

            if(dish.image.resolution == 1.33) {
                this.imageClass = "r2";
            } else if(dish.image.resolution == 1.77) {
                this.imageClass = "r3";
            }


            setTimeout(() => {
                this.time.minutes++;
                if(this.time.minutes == 60) {
                    this.time.minutes = 0;
                    this.time.hours++;
                }
                this.interval1 = setInterval(() => {
                    this.time.minutes++;
                    if(this.time.minutes == 60) {
                        this.time.minutes = 0;
                        this.time.hours++;
                    }
                }, 60000);
            }, time.nextMinute);

            setTimeout(() => {
                this.timeDone.minutes++;
                if(this.timeDone.minutes == 60) {
                    this.timeDone.minutes = 0;
                    this.timeDone.hours++;
                }
                this.interval2 = setInterval(() => {
                    this.timeDone.minutes++;
                    if(this.timeDone.minutes == 60) {
                        this.timeDone.minutes = 0;
                        this.timeDone.hours++;
                    }
                }, 60000);
            }, timeDone.nextMinute);

        } catch (e) {
            if(e == 404) {
                this.modalCtrl.dismiss();
                (await this.toastCtrl.create({
                    duration: 1500,
                    color: "red",
                    mode: "ios",
                    message: "Something is wrong. Please reload the page and try again.",
                })).present();
            }
        }
    }
    ngOnDestroy(): void {
        clearInterval(this.interval1);
        clearInterval(this.interval2);
    }
}
