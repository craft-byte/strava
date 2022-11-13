import { CommonModule } from '@angular/common';
import { Component, ViewChild, EventEmitter, OnInit, ViewContainerRef, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { getImage } from 'src/functions';
import { StaffService } from '../../staff.service';

@Component({
    selector: 'app-manual-order-modal',
    templateUrl: './manual-order-modal.component.html',
    styleUrls: ['./manual-order-modal.component.scss'],
    imports: [CommonModule, IonicModule, FormsModule],
    standalone: true,
})
export class ManualOrderModalComponent implements OnInit {

    settings: any;
    dishes: any[] = [];
    
    selected: any[] = [];
    comment: string;
    type: string;

    constructor(
        private service: StaffService,
        private toastCtrl: ToastController,
    ) { };
    
    @ViewChild("dishModalContainer", { read: ViewContainerRef }) dishModal: ViewContainerRef;
    @ViewChild("checkoutModalContainer", { read: ViewContainerRef }) checkoutModal: ViewContainerRef;

    @Output() leave = new EventEmitter();


    async save() {
        const dishes = [];

        for(let i of this.selected) {
            dishes.push({ amount: i.amount, _id: i._id });
        }

        const result: any = await this.service.post({ dishes, comment: this.comment, type: this.type }, "manual", "confirm-order");

        if(result.success) {
            this.leave.emit();
        }
    }

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
                this.save();
            }
            component.destroy();
        });

    }

    async openDishModal(dish: any) {
        const { DishModalComponent } = await import("./dish-modal/dish-modal.component");

        const component = this.dishModal.createComponent(DishModalComponent);

        component.instance.dish = dish;
        
        for(let i of this.selected) {
            if(i._id == dish._id) {
                component.instance.amount = i.amount;
                break;
            }
        }

        component.instance.leave.subscribe((amount: number) => {
            component.destroy();
            if(amount || amount === 0) {
                for(let i in this.selected) {
                    if(this.selected[i]._id == dish._id) {
                        this.selected[i].amount = amount;
                        if(amount == 0) {
                            this.selected.splice(+i, 1);
                        }
                        return;
                    }
                }
                this.selected.push({ ...dish, amount });
            }

        });
    }

    async ngOnInit() {
        const result: any = await this.service.get("manual", "init");

        console.log(result);

        if(result) {
            this.settings = result.settings;

            for(let i of result.dishes) {
                this.dishes.push({
                    ...i,
                    image: getImage(i.image?.binary),
                });
            }
        }

    }
}
