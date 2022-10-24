import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Injector, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { StaffService } from 'src/app/staff/staff.service';

@Component({
    selector: 'app-manual-order',
    templateUrl: './manual-order.component.html',
    styleUrls: ['./manual-order.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule],
    animations: [
        trigger("showUp", [
            transition(":enter", [
                group([
                    style({ backgroundColor: "rgba(0,0,0,0)" }),
                    animate("200ms ease-out", style({ backgroundColor: "rgba(0,0,0,0.25)" })),
                    query(".box", [
                        style({ opacity: 0, scale: 0.6 }),
                        animate("200ms ease-out", style({ opacity: 1, scale: 1 })),
                    ])
                ])
            ])
        ])
    ]
})
export class ManualOrderComponent implements OnInit {

    selected: any[] = [];
    dishes: any[];

    comment: string;

    searchText: string;

    table: number;

    info: any;

    constructor(
        private service: StaffService,
        private injector: Injector,
        private loader: LoadService,
    ) { };

    @ViewChild("dishContainer", { read: ViewContainerRef }) dishContainer: ViewContainerRef;
    @ViewChild("checkoutContainer", { read: ViewContainerRef }) checkoutContainer: ViewContainerRef;
    @ViewChild("tableContainer", { read: ViewContainerRef }) tableContainer: ViewContainerRef;
    @Output() leave = new EventEmitter();


    async selectTable() {
        const { TableComponent } = await import("./table/table.component");

        const component = this.tableContainer.createComponent(TableComponent, { injector: this.injector });

        component.instance.out = this.info.out;
        component.instance.tables = this.info.tables;

        component.instance.leave.subscribe(res => {
            if(res) {
                if(res.table) {
                    this.table = res.table;
                } else if(res.out) {
                    this.table = null;
                }
            }
            component.destroy();
        });
    }

    async checkout() {
        const { CheckoutComponent } = await import("./checkout/checkout.component");

        const component = this.checkoutContainer.createComponent(CheckoutComponent, { injector: this.injector });

        component.instance.dishes = this.selected;
        component.instance.comment = this.comment;
        component.instance.table = this.table;

        component.instance.leave.subscribe(async res => {
            component.destroy();
            if(res) {
                const update: any = await this.service.post({ dishes: this.selected, comment: this.comment, table: this.table, }, "waiter/manual/cash");

                if(update.success) {
                    this.leave.emit();
                }
            }
        });

    }


    async find() {
        if(!this.searchText || this.searchText.length < 1) {
            return;
        }
        
        const result = await this.service.post({ text: this.searchText }, "waiter/manual/find");

        this.dishes = result as any;
    }

    async go(id: string) {
        await this.loader.start();

        const { DishComponent } = await import("./dish/dish.component");

        let amount = 0;
        let index = 0;

        for(let i in this.selected) {
            if(this.selected[i]._id == id) {
                amount = this.selected[i].amount;
                index = +i;
            }
        }

        const component = this.dishContainer.createComponent(DishComponent, { injector: this.injector });

        component.instance.dishId = id;
        component.instance.amount = amount;

        component.instance.leave.subscribe((res: { name: string; amount: number; price: number; }) => {
            if(res) {
                if(index) {
                    this.selected[index].amount = res.amount;
                } else {
                    this.selected.push(res);
                }
            }
            component.destroy();
        });

        
    }

    async ngOnInit() {
        const info = await this.service.get("waiter/manual/info");

        this.info = info;
        console.log(info);
    }

}
