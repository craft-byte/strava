import { Component, Injector, OnInit, ViewChild, OnDestroy, ViewContainerRef } from '@angular/core';
import { StaffService } from '../../staff.service';
import { SoloService } from '../solo.service';
import { Subscription } from "rxjs";
import { WaiterRequest } from '../../models/WaiterRequest';
import { WaiterData } from '../../models/messages';

interface OrderDish {
    dishId: string;
    _id: string;
    time: any;
    cooked?: {
        time: any;
    }
}

@Component({
    selector: 'app-waiter',
    templateUrl: './waiter.component.html',
    styleUrls: ['./waiter.component.scss'],
})
export class WaiterComponent implements OnInit, OnDestroy {

    orderDishes: OrderDish[];
    waiterRequests: WaiterRequest[];
    subscription: Subscription;



    constructor(
        private service: StaffService,
        private s: SoloService,
        private injector: Injector
    ) { };

    @ViewChild("dishModalContainer", { read: ViewContainerRef }) dishModal: ViewContainerRef;
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async openModal(orderDish: any) {
        const { DishModalComponent } = await import("./dish-modal/dish-modal.component");

        const component = this.dishModal.createComponent(DishModalComponent, { injector: this.injector });

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
            component.destroy();
        });
    }

    onWaiterRequestEmitted({ type, requestId, request }: { type: "accept" | "remove"; requestId: string; request: WaiterRequest }) {
        if (type == "remove") {
            for (let i in this.waiterRequests) {
                if (this.waiterRequests[i]._id == requestId) {
                    this.waiterRequests.splice(+i, 1);
                    break;
                }
            }
        }

        else if (type == "accept") {
            this.handleWaiterRequestModal(request);
        }
    }

    async handleWaiterRequestModal(request: WaiterRequest) {
        const { WaiterRequestModalComponent } = await import("./waiter-request-modal/waiter-request-modal.component");


        const component = this.modalContainer.createComponent(WaiterRequestModalComponent);

        component.instance.request = request;

        component.instance.leave.subscribe((remove: boolean) => {
            if (remove) {
                for (let i in this.waiterRequests) {
                    if (this.waiterRequests[i]._id == request._id) {
                        this.waiterRequests.splice(+i, 1);
                        break;
                    }
                }
            }
            component.destroy();
        });
    }


    async ngOnInit() {
        const result = await this.service.get<{ dishes: any; acceptedWaiterRequest: WaiterRequest; orderDishes: OrderDish[]; waiterRequests: WaiterRequest[]; }>("waiter", "init");

        console.log(result);

        this.orderDishes = result.orderDishes;
        this.waiterRequests = result.waiterRequests;

        this.s.dishes = { ...this.s.dishes, ...result.dishes };

        if (result.acceptedWaiterRequest) {
            this.handleWaiterRequestModal(result.acceptedWaiterRequest);
        }

        this.subscription = this.s.waiter.subscribe(async res => {
            const { type } = res;

            console.log(res);


            if (type == "dish/new") {
                const dish = res.data as WaiterData.Dish;

                this.orderDishes.push(dish);
            } else if (type == "dish/served") {
                const { _id, dishId } = res.data as WaiterData.Dish;

                for (let i in this.orderDishes) {
                    if (this.orderDishes[i]._id == _id) {
                        this.orderDishes.splice(+i, 1);
                        break;
                    }
                }
            } else if (type == "request/removed") {
                const { requestId } = res.data as WaiterData.Request;

                console.log(this.waiterRequests);

                for (let i in this.waiterRequests) {
                    if (this.waiterRequests[i]._id == requestId) {
                        this.waiterRequests.splice(+i, 1);
                        break;
                    }
                }
            } else if (type == "request/new") {
                const { requestId } = res.data as WaiterData.Request;

                const newRequest: WaiterRequest = await this.service.get("waiter", "waiterRequest", requestId);

                if (newRequest) {
                    this.waiterRequests.push(newRequest);
                }
            }
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

}
