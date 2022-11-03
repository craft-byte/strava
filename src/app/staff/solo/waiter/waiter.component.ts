import { Component, Injector, OnInit, ViewChild, OnDestroy, ViewContainerRef } from '@angular/core';
import { StaffService } from '../../staff.service';
import { SoloService } from '../solo.service';
import { Subscription } from "rxjs";

@Component({
    selector: 'app-waiter',
    templateUrl: './waiter.component.html',
    styleUrls: ['./waiter.component.scss'],
})
export class WaiterComponent implements OnInit, OnDestroy {

    orderDishes: any;
    subscription: Subscription;

    constructor(
        private service: StaffService,
        private s: SoloService,
        private injector: Injector
    ) { };

    @ViewChild("dishModalContainer", { read: ViewContainerRef }) dishModal: ViewContainerRef;

    async openModal(orderDish: any) {
        const { DishModalComponent } = await import("./dish-modal/dish-modal.component");

        const component = this.dishModal.createComponent(DishModalComponent, { injector: this.injector });

        component.instance.orderDish = orderDish;

        component.instance.leave.subscribe((del: boolean) => {
            if(del) {
                for(let i in this.orderDishes) {
                    if(this.orderDishes[i]._id == orderDish._id) {
                        this.orderDishes.splice(+i, 1);
                        break;
                    }
                }
            }
            component.destroy();
        });
    }


    async ngOnInit() {
        const result = await this.service.get<{ dishes: any; orderDishes: any; }>("waiter", "dishes");

        this.orderDishes = result.orderDishes;

        this.s.dishes = { ...this.s.dishes, ...result.dishes };

        this.subscription = this.s.flow.subscribe(async res => {
            const { type } = res;


            if (type == "waiter/dish/new") {
                const dish = res.data as any;

                this.orderDishes.push(dish);
            } else if (type == "waiter/dish/served") {
                const { orderDishId, dishId } = res.data as any;

                for (let i in this.orderDishes) {
                    if (this.orderDishes[i]._id == orderDishId) {
                        this.orderDishes.splice(+i, 1);
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
