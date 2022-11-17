import { CommonModule } from '@angular/common';
import { Component, ViewChild, EventEmitter, OnInit, ViewContainerRef, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { getImage } from 'src/functions';
import { StaffService } from '../../staff.service';
import { DishComponent } from './dish/dish.component';

@Component({
    selector: 'app-manual-order-modal',
    templateUrl: './manual-order-modal.component.html',
    styleUrls: ['./manual-order-modal.component.scss'],
    imports: [CommonModule, IonicModule, FormsModule, DishComponent],
    standalone: true,
})
export class ManualOrderModalComponent implements OnInit {

    settings: any;
    dishes: any[] = [];
    
    selected: { _id: string; name: string; price: number; orderDishes: { _id: string; comment: string; }[] }[] = [];
    comment: string;
    type: string;

    constructor(
        private service: StaffService,
        private toastCtrl: ToastController,
        private loader: LoadService,
    ) { };
    
    @ViewChild("dishModalContainer", { read: ViewContainerRef }) dishModal: ViewContainerRef;
    @ViewChild("checkoutModalContainer", { read: ViewContainerRef }) checkoutModal: ViewContainerRef;
    @ViewChild("commentModalContainer", { read: ViewContainerRef }) commentModal: ViewContainerRef;

    @Output() leave = new EventEmitter();



    async submit() {
        if(!this.selected || this.selected.length == 0) {
            (await this.toastCtrl.create({
                duration: 1500,
                message: "Please add dishes to the order",
                mode: "ios",
                color: "green",
            })).present();
            return;
        }

        const { CheckoutModalComponent } = await import("./checkout-modal/checkout-modal.component");

        const component = this.checkoutModal.createComponent(CheckoutModalComponent);

        component.instance.leave.subscribe(async res => {
            if(res) {
                this.leave.emit();
            }
            component.destroy();
        });

    }
    async openDishModal(dishId: string, name: string, price: number) {
        const { DishModalComponent } = await import("./dish-modal/dish-modal.component");

        const component = this.dishModal.createComponent(DishModalComponent);

        component.instance.dishId = dishId;
        
        for(let i of this.selected) {
            if(i._id == dishId) {
                component.instance.amount = i.orderDishes.length;
                break;
            }
        }

        component.instance.dish = { name, price };

        component.instance.leave.subscribe(async (add: boolean) => {
            if(add) {
                await this.loader.start();

                const result: any = await this.service.post({ dishId: dishId }, "manual/order/dish");

                if(!result || !result._id) {
                    (await this.toastCtrl.create({
                        duration: 1500,
                        color: "red",
                        message: "Couldn't add dish, please try again.",
                        mode: "ios",
                    })).present();
                }

                for(let i in this.selected) {
                    if(this.selected[i]._id == dishId) {
                        this.selected[i].orderDishes.push({ _id: result._id, comment: null!, });
                        this.loader.end();
                        return;
                    }
                }


                this.selected.push({ price: component.instance.dish.price, name: component.instance.dish.name, _id: dishId, orderDishes: [ { _id: result._id, comment: null!, } ] });

                this.loader.end();
                return;
            }
            component.destroy();

        });
    }
    async openDishesDetails(data: any) {
        const { DishesDetailsComponent } = await import("./dishes-details/dishes-details.component");

        const component = this.dishModal.createComponent(DishesDetailsComponent);

        component.instance.orderDishes = data.orderDishes;
        component.instance.name = data.name;

        component.instance.leave.subscribe((id: string) => {
            if(id == "open") {
                this.openDishModal(data._id, data.name, data.price);
                return;
            }
            if(id) {
                for(let i in data.orderDishes) {
                    if(data.orderDishes[i]._id == id) {
                        data.orderDishes.splice(+i, 1);
                        break;
                    }
                }
                if(data.orderDishes.length == 0) {
                    for(let i in this.selected) {
                        if(this.selected[i]._id == data._id) {
                            this.selected.splice(+i, 1);
                            break;
                        }
                    }
                }
                return;
            }
            component.destroy();
        });
    }

    /**
     * Order type
     */
    async setType(t: "takeaway" | "dinein") {
        if(this.type != t) {
            this.type = t;

            const update: any = await this.service.post({ type: t }, "manual", "order", "type");

            if(!update) {
                this.type = this.type == "takeaway" ? "dinein" : "takeaway";
            }
        }

    }

    /**
     * Order comment
     */
    async setComment() {
        const { CommentModalComponent } = await import("./comment-modal/comment-modal.component");

        const component = this.commentModal.createComponent(CommentModalComponent);

        if(this.comment) {
            component.instance.comment = this.comment;
        }

        component.instance.leave.subscribe(async (n: string) => {
            if(n) {
                let oc = this.comment;
                this.comment = n;

                const result: any = await this.service.post({ comment: n }, "manual/order/comment");

                if(!result.updated) {
                    this.comment = oc;
                    (await this.toastCtrl.create({
                        duration: 2000,
                        color: "red",
                        mode: "ios",
                        message: "Couldn't update the comment, please try again.",
                    })).present();
                }
            }
            component.destroy();
        });
    }

    async ngOnInit() {
        const result: any = await this.service.get("manual", "init");

        console.log(result);
        
        if(result) {
            this.comment = result.order?.comment;
            this.type = result.order?.type;
            this.settings = result.settings;
            this.selected = result.selected;


            for(let i of result.dishes) {
                this.dishes.push({
                    ...i,
                    image: getImage(i.image?.binary),
                });
            }
        }

    }
}
