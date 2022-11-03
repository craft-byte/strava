import { Component, OnInit, ViewChild, OnDestroy, ViewContainerRef, Injector } from '@angular/core';
import { StaffService } from '../../staff.service';
import { SoloService } from '../solo.service';
import { Subscription } from "rxjs";

@Component({
    selector: 'app-cook',
    templateUrl: './cook.component.html',
    styleUrls: ['./cook.component.scss'],
})
export class CookComponent implements OnInit, OnDestroy {

    dishes: any;
    orderDishes: any[];
    delayed: any;
    subscription: Subscription;

    constructor(
        private service: StaffService,
        private s: SoloService,
        private injector: Injector,
    ) { };

    @ViewChild("dishModalContainer", { read: ViewContainerRef }) dishModal: ViewContainerRef;

    async openModal(orderDish: any) {
        const { DishModalComponent } = await import("./dish-modal/dish-modal.component");

        const component = this.dishModal.createComponent(DishModalComponent, { injector: this.injector });

        component.instance.dish = this.s.dishes[orderDish.dishId];
        component.instance.orderDish = orderDish;

        component.instance.leave.subscribe((del: boolean) => {
            if (del) {
                for (let i in this.orderDishes) {
                    if (this.orderDishes[i]._id == orderDish._id) {
                        this.orderDishes.splice(+i, 1);
                        break;
                    }
                }
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


        this.subscription = this.s.flow.subscribe(async res => {
            const { type } = res;


            if (type == "kitchen/dish/take") {
                const { orderDishId, taken: { user } } = res.data as any;
                for (let i in this.delayed) {
                    if (this.delayed[i]._id == orderDishId) {
                        this.delayed.splice(+i, 1);
                        break;
                    }
                }
                for (let i of this.orderDishes) {
                    if (i._id == orderDishId) {
                        i.taken = user._id;
                        return;
                    }
                }
            } else if (type == "kitchen/order/new") {
                const dishes = res.data as any[];
                for (let i of dishes) {
                    if (!this.s.dishes[i.dishId]) {
                        const dish = await this.service.get("kitchen/dish", i.dishId);
                        if (!dish) {
                            continue;
                        }
                        this.s.dishes[i.dishId] = dish;
                    }
                    this.orderDishes.push(i);
                }
            } else if (type == "kitchen/dish/done") {
                const { orderDishId } = res.data as any;

                for (let i in this.orderDishes) {
                    if (this.orderDishes[i]._id == orderDishId) {
                        this.orderDishes.splice(+i, 1);
                        break;
                    }
                }
            } else if (type == "kitchen/dish/quitted") {
                const { orderDishId } = res.data as any;

                for (let i in this.orderDishes) {
                    if (this.orderDishes[i]._id == orderDishId) {
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
