import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { ArgumentOutOfRangeError, Subscription } from 'rxjs';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/services/main.service';
import { Dish } from 'src/models/dish';
import { StaffService } from '../../staff.service';
import { DishModalPage } from '../dish-modal/dish-modal.page';
import { KitchenService } from '../kitchen.service';


interface OrderDish { // dish from order
    _id: string;
    dishId: string;
    orderId: string;
    taken: string;
    time: {
        hours: number;
        minutes: number;
        nextMinute: number;
        color: string;
    }
}




@Component({
    selector: 'app-main',
    templateUrl: './main.page.html',
    styleUrls: ['./main.page.scss'],
})
export class MainPage implements OnInit, OnDestroy {

    delayed: OrderDish[];

    subscription: Subscription;

    allDishes: { [key: string]: OrderDish[] };

    ui = {
        title: "Restaurant name",
    }

    constructor(
        private service: StaffService,
        private kitchen: KitchenService,
        private router: RouterService,
        private loader: LoadService,
        private modalCtrl: ModalController,
        private main: MainService,
        private toastCtrl: ToastController,
    ) { };

    back() {
        this.router.go(["staff", this.service.restaurantId, "dashboard"], { replaceUrl: true });
    }

    async onDishClick(orderId: string, orderDishId: string) {
        const modal = await this.modalCtrl.create({
            component: DishModalPage,
            mode: "ios",
            cssClass: "modal-width",
            componentProps: {
                orderDishId,
                orderId
            },
        });

        await modal.present();


        const { role } = await modal.onDidDismiss();

        if (role && role == "done") {
            this.doneDish(orderDishId);
        }

    }

    async doneDish(orderDishId: string) {
        let dishId: string;
        for (let i in this.delayed) {
            if (this.delayed[i]._id == orderDishId) {
                dishId = this.delayed[i].dishId;
                this.delayed.splice(+i, 1);
                break;
            }
        }
        for (let c of Object.keys(this.allDishes)) {
            for (let i in this.allDishes[c]) {
                if (this.allDishes[c][i]._id == orderDishId) {
                    dishId = this.allDishes[c][i].dishId;
                    this.allDishes[c].splice(+i, 1);
                    break;
                }
            }
        }

        (await this.toastCtrl.create({
            message: `${this.kitchen.dishes[dishId].name} is done`,
            color: "green",
            duration: 1500,
            mode: "ios",
        })).present();
    }



    async ngOnInit() {
        await this.loader.start();
        try {
            const result: any = await this.service.post({ socketId: this.kitchen.socketId }, "kitchen/init");

            const { delayed, dishes, allDishes } = result;


            this.kitchen.dishes = dishes;
            this.delayed = delayed;
            this.allDishes = allDishes;

            this.subscription = this.kitchen.connect().subscribe(async res => {

                const { type } = res;


                if (type == "kitchen/dish/take") {
                    const { orderDishId, taken: { user } } = res.data as any;
                    for (let i in this.delayed) {
                        if (this.delayed[i]._id == orderDishId) {
                            this.delayed.splice(+i, 1);
                            break;
                        }
                    }
                    for (let key of Object.keys(this.allDishes)) {
                        for (let i of this.allDishes[key]) {
                            if (i._id == orderDishId) {
                                i.taken = user._id;
                                return;
                            }
                        }
                    }
                } else if (type == "kitchen/order/new") {
                    const dishes = res.data as any[];
                    for (let i of dishes) {
                        if (!this.kitchen.dishes[i.dishId]) {
                            const dish: Dish = await this.service.get("kitchen/dish", i.dishId);
                            if (!dish) {
                                continue;
                            }
                            this.kitchen.dishes[i.dishId] = dish;
                        }
                        this.allDishes[i.general].push(i);
                    }
                } else if (type == "kitchen/dish/done") {
                    const { orderDishId } = res.data as any;

                    this.doneDish(orderDishId);
                } else if (type == "userIdRequired") {
                    this.kitchen.emit("connectWithUserId", { restaurantId: this.service.restaurantId, userId: this.main.user._id, joinTo: "kitchen", })
                } else if (type == "kitchen/dish/quitted") {
                    const { orderDishId } = res.data as any;

                    for (let c of Object.keys(this.allDishes)) {
                        for (let i in this.allDishes[c]) {
                            if (this.allDishes[c][i]._id == orderDishId) {
                                this.allDishes[c][i].taken = null;
                                break;
                            }
                        }
                    }
                }
            });

        } catch (e) {
            throw e;
        }
        this.loader.end();
    }
    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

}
