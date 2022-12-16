import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ViewContainerRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { OrderDish } from '../../other/models/order';
import { OrderService } from '../../order.service';
import { CustomerService } from 'src/app/customer/customer.service';

@Component({
    selector: 'app-order-dish-info',
    templateUrl: './order-dish-info.component.html',
    styleUrls: ['./order-dish-info.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule]
})
export class OrderDishInfoComponent implements OnInit {

    amount: number = 0;

    constructor(
        public order: OrderService,
        private service: CustomerService,
    ) { };

    @Input() dish: OrderDish;
    @Output() leave = new EventEmitter();

    @ViewChild("commentContainer", { read: ViewContainerRef }) commentContainer: ViewContainerRef;

    close() {
        this.leave.emit();
    }

    async comment() {
        const comment = await this.getComment();

        if(!comment) {
            return;
        }

        const oc = this.dish.comment;
        this.dish.comment = comment.trim();

        const update: any = await this.service.post({ comment: comment.trim() }, "order", this.service.restaurantId, "session", "dish", this.dish._id, "comment");

        if(!update.updated) {
            this.dish.comment = oc;
        }
    }

    getComment() {
        return new Promise<string>(async resolve => {
            const { CommentModalComponent } = await import("./../../other/comment-modal/comment-modal.component");

            const component = this.commentContainer.createComponent(CommentModalComponent);

            component.instance.comment = this.dish.comment;

            component.instance.leave.subscribe((comment: string) => {
                resolve(comment);
                component.destroy();
            });
        });
    }

    remove() {
        this.leave.emit("remove");
    }
    fullDish() {
        this.leave.emit("fulldish");
    }


    ngOnInit() {
        for(let i of this.order.dishes) {
            if(i.dishId == this.dish.dishId) {
                this.amount++;
            }
        }
    }
}
