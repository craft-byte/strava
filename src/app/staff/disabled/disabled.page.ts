import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Subscription } from "rxjs";
import { RouterService } from 'src/app/other/router.service';
import { StaffService } from '../staff.service';
import { SocketForDisabledPageService } from './disabled.service';


interface Order {
    time: string;
    total: number;
    user: {
        name: string;
        _id: any;
    };
}



@Component({
    selector: 'app-disabled',
    templateUrl: './disabled.page.html',
    styleUrls: ['./disabled.page.scss'],
})
export class DisabledPage implements OnInit {

    subscription: Subscription;
    orders: Order[]

    constructor(
        private soc: SocketForDisabledPageService,
        private service: StaffService,
        private router: RouterService,
    ) { };

    close() {
        this.router.go(["restaurant", this.service.restaurantId, "home"]);
    }

    @ViewChild("addOrderModalContainer", { read: ViewContainerRef }) container: ViewContainerRef;

    async add() {
        const { ManualOrderModalComponent } = await import("./../manual-order-modal/manual-order-modal.component");


        const component = this.container.createComponent(ManualOrderModalComponent);

        component.instance.leave.subscribe(res => {
            component.destroy();
        });
    }

    async ngOnInit() {
        const result: Order[] = await this.service.post({ socketId: this.soc.socketId }, "orders");

        if(result) {
            this.orders = result;
        }

        this.subscription = this.soc.flow.subscribe(res => {
            if(res.type == "new-order") {
                this.orders.unshift(res.order);
            }
        });
    }

}
