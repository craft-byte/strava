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

    close() {
        this.router.go(["restaurant", this.service.restaurantId]);
    }

    async manualOrder() {
        return;
        
        const { ManualOrderModalComponent } = await import("./manual-order-modal/manual-order-modal.component");

        const component = this.manualOrderModal.createComponent(ManualOrderModalComponent, { injector: this.injector });

        
    }

    async ngOnInit() {

    }

}