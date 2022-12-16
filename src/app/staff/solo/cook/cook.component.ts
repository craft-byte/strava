import { Component, OnInit, ViewChild, OnDestroy, ViewContainerRef, Injector, Output, EventEmitter } from '@angular/core';
import { StaffService } from '../../staff.service';
import { SoloService } from '../solo.service';
import { Subscription } from "rxjs";
import { CookData } from '../../models/messages';

@Component({
    selector: 'app-cook',
    templateUrl: './cook.component.html',
    styleUrls: ['./cook.component.scss'],
})
export class CookComponent implements OnInit, OnDestroy {

    dishes: any;
    orderDishes: any;
    delayed: any;
    subscription: Subscription;

    constructor(
        private service: StaffService,
        private s: SoloService,
        private injector: Injector,
    ) { };

    @ViewChild("dishModalContainer", { read: ViewContainerRef }) dishModal: ViewContainerRef;
    
    @Output() leave = new EventEmitter<string>();

    async openModal(orderDish: any) {
        const { DishModalComponent } = await import("./dish-modal/dish-modal.component");

        const component = this.dishModal.createComponent(DishModalComponent, { injector: this.injector });

        component.instance.dish = this.s.dishes[orderDish.dishId];
        component.instance.orderDish = orderDish;

        component.instance.leave.subscribe((res: number) => {
            if (res == 1) {
                for (let i in this.orderDishes) {
                    if (this.orderDishes[i]._id == orderDish._id) {
                        this.orderDishes.splice(+i, 1);
                        break;
                    }
                }
            } else if(res == 2) {
                this.leave.emit(orderDish.orderId);
                return;
            }
            component.instance.subscription.unsubscribe();
            component.destroy();
        });
    }

    async ngOnInit() {
        const result: any = await this.service.get("cook/dishes");

        if (result) {
            this.dishes = result.dishes;
            this.orderDishes = result.all;
            this.delayed = result.delayed;

            this.s.dishes = result.dishes;
        }


        this.subscription = this.s.cook.subscribe(async res => {
            const { type } = res;

            if (type == "dish/taken") {
                const { _id, taken: { user } } = res.data as CookData.Dish;

                for (let i in this.delayed) {
                    if (this.delayed[i]._id == _id) {
                        this.delayed.splice(+i, 1);
                        break;
                    }
                }
                for (let i of this.orderDishes) {
                    if (i._id == _id) {
                        i.taken = user._id;
                        return;
                    }
                }
            }
            
            else if (type == "order/new") {
                const dishes = res.data as CookData.OrderNew;
                for (let i of dishes) {
                    if (!this.s.dishes[i.dishId]) {
                        const dish = await this.service.get("dish", i.dishId);
                        if (!dish) {
                            continue;
                        }
                        this.s.dishes[i.dishId] = dish;
                    }
                    this.orderDishes.push(i);
                }
            } else if (type == "dish/done") {
                const { _id } = res.data as CookData.Dish;

                for (let i in this.orderDishes) {
                    if (this.orderDishes[i]._id == _id) {
                        this.orderDishes.splice(+i, 1);
                        break;
                    }
                }
            } else if (type == "dish/quitted") {
                const { _id } = res.data as CookData.Dish;

                for (let i in this.orderDishes) {
                    if (this.orderDishes[i]._id == _id) {
                        this.orderDishes[i].taken = null;
                        break;
                    }
                }
            }
        });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

}
