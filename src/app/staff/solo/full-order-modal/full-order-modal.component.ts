import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { getImage } from 'src/functions';
import { StaffService } from '../../staff.service';

@Component({
    selector: 'app-full-order-modal',
    templateUrl: './full-order-modal.component.html',
    styleUrls: ['./full-order-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule],
})
export class FullOrderModalComponent implements OnInit {

    order: any;
    dishes: any = {};

    customerAvatar: string;

    constructor(
        private service: StaffService,
    ) { };

    @Input() orderId: string;
    @Output() leave = new EventEmitter();

    openDish(orderDish: any) {
        // add to subscription on solo service and open dish-modal from waiter or cook components
        // this.leave.emit(orderDish);
    }

    async ngOnInit() {
        const result: any = await this.service.get("order", this.orderId);

        if(result) {
            this.order = result.order;
            
            for(let i of Object.keys(result.dishes)) {
                this.dishes[i] = {
                    ...result.dishes[i],
                    image: getImage(result.dishes[i].image?.binary),
                };
            }

            if(result.order.customer?.avatar) {
                this.customerAvatar = getImage(result.order.customer.avatar);
            }
        }

    }

}
