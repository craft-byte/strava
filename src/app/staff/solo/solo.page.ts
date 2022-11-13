import { Component, OnInit, ViewChild, ViewContainerRef, Injector } from '@angular/core';
import { RouterService } from 'src/app/other/router.service';
import { StaffService } from '../staff.service';

@Component({
    selector: 'app-solo',
    templateUrl: './solo.page.html',
    styleUrls: ['./solo.page.scss'],
})
export class SoloPage implements OnInit {

    constructor(
        private router: RouterService,
        private service: StaffService,
        private injector: Injector
    ) { };

    @ViewChild("manualOrderModalContainer", { read: ViewContainerRef }) manualOrderModal: ViewContainerRef;
    @ViewChild("fullOrderModalContainer", { read: ViewContainerRef }) fullOrderModal: ViewContainerRef;

    close() {
        this.router.go(["restaurant", this.service.restaurantId]);
    }

    async manualOrder() {
        const { ManualOrderModalComponent } = await import("./manual-order-modal/manual-order-modal.component");

        const component = this.manualOrderModal.createComponent(ManualOrderModalComponent, { injector: this.injector });

        component.instance.leave.subscribe(res => {
            component.destroy();
        });
    }

    async fullOrder(orderId: string) {
        const { FullOrderModalComponent } = await import("./full-order-modal/full-order-modal.component");

        const component = this.fullOrderModal.createComponent(FullOrderModalComponent, { injector: this.injector });

        component.instance.orderId = orderId;

        component.instance.leave.subscribe(() => {
            component.destroy();
        });
    }


    async ngOnInit() {
    }

}