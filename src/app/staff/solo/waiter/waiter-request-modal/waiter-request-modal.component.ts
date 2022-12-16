import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CustomerService } from 'src/app/customer/customer.service';
import { OrderService } from 'src/app/customer/order/order.service';
import { CustomerData } from 'src/app/customer/order/other/models/messages';
import { WaiterRequest } from 'src/app/staff/models/WaiterRequest';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';
import { SoloService } from '../../solo.service';

@Component({
    selector: 'app-waiter-request-modal',
    templateUrl: './waiter-request-modal.component.html',
    styleUrls: ['./waiter-request-modal.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class WaiterRequestModalComponent implements OnInit {

    avatar: string;
    subcription: Subscription;
    
    constructor(
        private service: StaffService,
    ) { }



    @Input() request: WaiterRequest;
    @Input() leave = new EventEmitter();


    async quit() {
        const result: any = await this.service.delete("waiter", "waiterRequest", this.request._id, "quit");

        if(result.updated) {
            this.leave.emit();
        }
    }

    async payed() {
        const result: any = await this.service.post({ requestId: this.request._id, sessionId: this.request.sessionId }, "waiter", "session/payed")

        console.log(result);

        if(result.updated) {
            this.leave.emit(true);
            return;
        }
    }

    resolved() {
        // implement
    }


    ngOnInit() {
        if(this.request.customer.avatar) {
            this.avatar = getImage(this.request.customer.avatar);
        }        
    }

}
