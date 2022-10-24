import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, Input, ViewChild, ViewContainerRef, Injector } from '@angular/core';
import { LoadService } from 'src/app/other/load.service';
import { StaffService } from 'src/app/staff/staff.service';

@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class CheckoutComponent implements OnInit {

    total: number;
    hst: number;
    subtotal: number = 0;

    constructor(
        private injector: Injector,
        private service: StaffService,
        private loader: LoadService,
    ) { }

    @Output() leave = new EventEmitter();
    @Input() dishes: { amount: number; name: string; price: number; }[];
    @Input() comment: string;
    @Input() table: number;

    @ViewChild("cashContainer", { read: ViewContainerRef }) cashContainer: ViewContainerRef;
    @ViewChild("cardContainer", { read: ViewContainerRef }) cardContainer: ViewContainerRef;


    async cash() {
        const { CashComponent } = await import("./cash/cash.component");

        const component = this.cashContainer.createComponent(CashComponent, { injector: this.injector });

        component.instance.total = this.total;

        component.instance.leave.subscribe(res => {
            component.destroy();

            if(res) {
                this.leave.emit(true);
            }
        });

    }
    async card() {
        await this.loader.start();
        const result: { clientSecret: string; } = await this.service.post({ dishes: this.dishes, comment: this.comment, table: this.table, }, "waiter/manual/card");        

        const { CardComponent } = await import("./card/card.component");

        const component = this.cardContainer.createComponent(CardComponent, { injector: this.injector });

        component.instance.total = this.total;
        component.instance.elementsOptions.clientSecret = result.clientSecret;

        this.loader.end();

        component.instance.leave.subscribe(res => {
            component.destroy();

            if(res) {
                this.leave.emit(true);
            }
        });

    }


    async ngOnInit() {
        for(let i of this.dishes) {
            this.subtotal += i.price * i.amount;
        }
        this.hst = this.subtotal * 0.13;
        this.total = this.subtotal + this.hst;
    }

}
