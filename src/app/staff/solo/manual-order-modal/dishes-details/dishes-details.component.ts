import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { StaffService } from 'src/app/staff/staff.service';
import { getImage } from 'src/functions';

@Component({
    selector: 'app-dishes-details',
    templateUrl: './dishes-details.component.html',
    styleUrls: ['./dishes-details.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule],
})
export class DishesDetailsComponent implements OnInit {


    constructor(
        private service: StaffService,
        private loader: LoadService,
    ) { };

    @ViewChild("commentModalContainer", { read: ViewContainerRef }) commentModal: ViewContainerRef;

    @Input() orderDishes: any[];
    @Input() name: string;
    @Output() leave = new EventEmitter();

    async addComment(id: string) {
        const { CommentModalComponent } = await import("./comment-modal/comment-modal.component");

        const component = this.commentModal.createComponent(CommentModalComponent);

        for(let i of this.orderDishes) {
            if(i._id == id) {
                component.instance.comment = i.comment;
            }
        }

        component.instance.leave.subscribe(async (n: string) => {
            if(n || n?.length == 0) {
                let oc: string;
                for(let i of this.orderDishes) {
                    if(i._id == id) {
                        oc = i.comment;
                        i.comment = n;

                        const update: any = await this.service.post({ comment: n.length > 0 ? n : "./;" }, "manual/order/dish", id, "comment");
        
                        if(!update.updated) {
                            i.comment = oc;
                        }
                    }
                }
            }
            component.destroy();
        });
    }

    open() {
        this.leave.emit("open");
    }

    async remove(id: string) {
        await this.loader.start();

        const result: any = await this.service.delete("manual/order/dish", id);

        if(result.updated) {
            for(let i in this.orderDishes) {
                if(this.orderDishes[i]._id == id) {
                    this.orderDishes.splice(+i, 1);
                    this.leave.emit(id);
                    break;
                }
            }
        }

        this.loader.end();
    }

    ngOnInit() {
        
    };

}
