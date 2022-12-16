import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ViewContainerRef, ChangeDetectorRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CustomerService } from 'src/app/customer/customer.service';
import { general } from 'src/assets/consts';
import { getImage } from 'src/functions';
import { OrderService } from '../../order.service';
import { Dish } from '../../other/models/dish';

@Component({
    selector: 'app-dish-modal',
    templateUrl: './dish-modal.component.html',
    styleUrls: ['./dish-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule]
})
export class DishModalComponent implements OnInit {

    image: string;
    imageClass: string;

    amount: number = 0;

    category: string;

    theme = "orange";

    ui = {
        showPlusOnly: false,
        showDoubleButton: true,
        showImageLoading: true,
        showLoading: true,
    }

    constructor(
        private order: OrderService,
        private service: CustomerService,
        public changeDetector: ChangeDetectorRef,
    ) {};

    @Input() dish: Dish;
    @Input() dishId: string;

    @Output() leave = new EventEmitter();

    @ViewChild("commentContainer", { read: ViewContainerRef }) commentContainer: ViewContainerRef;


    close() {
        this.leave.emit();
    }
    async add(withComment: boolean) {
        
        let comment = null;
        if(withComment) {
            comment = await this.getComment();
            
            if(!comment) {
                return;
            }
        }

        this.amount++;
        
        const update: any = await this.service.post({ dishId: this.dish._id, comment }, "order", this.service.restaurantId, "session", "dish");

        if(!update.updated) {
            this.amount--;
            return;
        }

        
        this.order.dishes.push({
            dishId: this.dish._id,
            price: this.dish.price,
            comment: comment,
            _id: update.insertedId,
            name: this.dish.name
        });
    }
    getComment() {
        return new Promise(async resolve => {
            const { CommentModalComponent } = await import("./../../other/comment-modal/comment-modal.component");
    
            const component = this.commentContainer.createComponent(CommentModalComponent);
    
            component.instance.leave.subscribe((comment: string) => {
                if(comment) {
                    resolve(comment.trim());
                }
                resolve(null);
                component.destroy();
            });
        })
    }

    async ngOnInit() {

        console.log("INITED");

        const params = this.getParams();
        
        try {
            const result: any = await this.service.get(params, "order", this.service.restaurantId, "dish", this.dishId || this.dish._id);

            this.dish = { ...this.dish, ...result };

            this.ui.showLoading = false;
        } catch (error) {
            if(error.status == 404) {
                this.close();
                return;
            }
        }

        for (let i of general) {
            if (i.value == this.dish.general) {
                this.category = i.title;
                break;
            }
        }

        if (this.dish.image) {
            this.image = getImage(this.dish.image.binary);
            this.ui.showImageLoading = false;

            if (this.dish.image.resolution == 1) {
                this.imageClass = "r1";
            } else if (this.dish.image.resolution == 1.33) {
                this.imageClass = "r2";
            } else if (this.dish.image.resolution == 1.77) {
                this.imageClass = "r3";
            }
        }

        for(let i of this.order.dishes) {
            if(i.dishId == this.dish._id) {
                this.amount++;
            }
        }
    }


    getParams() {
        const result: any = {};

        if(!this.dish) {
            result.full = "true";

            return result;
        }

        if(!this.dish.image) {
            result.image = "true";
        }
        if(!this.dish.description) {
            result.description = "true";
        }

        return result;
    }
}
