import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CustomerService } from 'src/app/customer/customer.service';
import { getImage } from 'src/functions';
import { OrderService } from '../../order.service';
import { CustomerData } from '../models/messages';
import { WaiterRequest } from '../models/waiterRequest';

@Component({
    selector: 'app-waiter-request-modal',
    templateUrl: './waiter-request-modal.component.html',
    styleUrls: ['./waiter-request-modal.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class WaiterRequestModalComponent implements OnInit {

    subscription: Subscription;
    waiterAvatar: string;

    payed = false;

    constructor(
        private service: CustomerService,
        private order: OrderService,
    ) { }

    @Input() request: WaiterRequest;
    @Output() leave = new EventEmitter();

    @ViewChild("paymentProgressModal", { read: ViewContainerRef }) paymentContainer: ViewContainerRef;


    async cancel() {
        const result: any = await this.service.delete({}, "order", this.service.restaurantId, "session/waiterRequest", this.request._id);

        if(result.updated) {
            this.leave.emit();
        }
    }

    close() {
        this.leave.emit();
    }


    ngOnInit() {

        if(this.request.waiter) {
            this.waiterAvatar = getImage(this.request.waiter.avatar);
        }

        this.subscription = this.order.flow.subscribe(async res => {

            console.log("WAITER REQUEST MODAL: ", res);

            if(res.type == "waiterRequest/canceled") {
                const data = res.data as CustomerData.WaiterRequest;

                if(this.request._id == data.requestId) {
                    
                    this.request.canceled = true;

                }
            } else if(res.type == "waiterRequest/accepted") {
                const data = res.data as CustomerData.WaiterRequest;


                this.request.accepted = true;
                
                if(data.waiter) {
                    this.request.waiter = data.waiter;
                    this.waiterAvatar = getImage(data.waiter.avatar);
                }

            } else if(res.type == "waiterRequest/quitted") {
                const data = res.data as CustomerData.WaiterRequest;

                if(this.request._id == data.requestId) {
                    this.request.accepted = false;
                    this.request.waiter = null;
                }
            }
            
            else if(res.type == "payment/succeeded") {
                
                this.onPayed();

            }
            
        });
    }

    async onPayed() {
        const { PaymentProgressComponent } = await import("./../../checkout/payment-progress/payment-progress.component");

        const component = this.paymentContainer.createComponent(PaymentProgressComponent);

        component.instance.status = "final";
    }

    ngOnDestroy() {
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
    }

}
