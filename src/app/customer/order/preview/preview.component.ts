import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter, ViewChild, ViewContainerRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { iif } from 'rxjs';
import { CustomerService } from '../../customer.service';
import { OrderType } from '../other/models/order';
import { OrderService } from '../order.service';
import { SelectedDishComponent } from './selected-dish/selected-dish.component';
import { CommaExpr } from '@angular/compiler';


@Component({
    selector: 'app-preview',
    templateUrl: './preview.component.html',
    styleUrls: ['./preview.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, SelectedDishComponent],
})
export class PreviewComponent implements OnInit {


    constructor(
        public order: OrderService,
        private service: CustomerService,
        public changeDetector: ChangeDetectorRef
    ) { };

    @Output() leave = new EventEmitter();

    @ViewChild("selectTableContainer", { read: ViewContainerRef }) selectTableContainer: ViewContainerRef;
    @ViewChild("checkoutContainer", { read: ViewContainerRef }) checkoutContainer: ViewContainerRef;

    close() {
        this.leave.emit();
    }


    async setType(type: OrderType) {
        const ot = this.order.type;
        this.order.type = type;

        try {
            const update: any = await this.service.post({ type: type, }, "order", this.service.restaurantId, "session", "type");

            this.order.id = update.id;

            if(!update.updated) {
                this.order.type = ot;
            }
        } catch (e) {
            if(e.status == 403) {
                if(e.body.reason == "TypeNotAllowed") {
                    if(type == "dinein") {
                        this.order.settings.allowDineIn = false;
                    } else {
                        this.order.settings.allowTakeOut = false;
                    }
                }
            }
            this.order.type = ot;
        }
    }


    async selectTable() {
        const { SelectTableComponent } = await import("./select-table/select-table.component");

        const component = this.selectTableContainer.createComponent(SelectTableComponent);

        component.instance.leave.subscribe(() => {
            component.destroy();
        });
    }


    onSelectedDishEmitter(action: "removed" | "dish") {
        if(action == "removed") {
            this.changeDetector.detectChanges();
        }
    }

    async setComment() {
        const { CommentModalComponent } = await import("./../other/comment-modal/comment-modal.component");

        const component = this.checkoutContainer.createComponent(CommentModalComponent);

        component.instance.comment = this.order.comment;
    
        component.instance.leave.subscribe(async (comment: string) => {
            if(comment && comment.length > 1) {
                const oc = this.order.comment;

                this.order.comment = comment;

                const update: any = await this.service.post({ comment: comment.trim() }, "order", this.service.restaurantId, "session", "comment");

                if(!update.updated) {
                    this.order.comment = oc;
                }
            }
            // if comment was removed by user its length will be 0 and type string
            else if(this.order.comment && typeof comment == "string" && comment.length == 0) {
                const oc = this.order.comment;
                this.order.comment = null;

                const update: any = await this.service.post({ comment: "REMOVECOMMENT" }, "order", this.service.restaurantId, "session", "comment");

                if(!update.updated) {
                    this.order.comment = oc;
                }
            }

            component.destroy();
        });
        
    }


    async openCheckout() {
        const { CheckoutComponent } = await import("./../checkout/checkout.component");

        const component = this.checkoutContainer.createComponent(CheckoutComponent);

    
        component.instance.leave.subscribe(() => {
            component.destroy();
        });
    }

    ngOnInit() { }

}
