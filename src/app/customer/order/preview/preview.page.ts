import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, EventEmitter, Injector, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { CustomerService } from '../../customer.service';
import { OrderService } from '../order.service';
import { TableComponent } from './table/table.component';

@Component({
    selector: 'app-preview',
    templateUrl: './preview.page.html',
    styleUrls: ['./preview.page.scss'],
    animations: [
        trigger('slideInOut', [
            transition(':enter', [
                group([
                    style({ background: "rgb(0,0,0,0)" }),
                    animate('350ms ease-in', style({ background: "rgb(0,0,0,0.5)" })),
                    query(".box", [
                        style({ transform: 'translateY(100%)', }),
                        animate("350ms ease-in", style({ transform: 'translateY(0%)' })),
                    ])
                ])
            ]),
            transition(':leave', [
                group([
                    animate("350ms ease-in", style({ background: "rgb(0,0,0,0.0)" })),
                    query(".box", [
                        animate('350ms ease-in', style({ transform: 'translateY(100%)' })),
                    ])
                ])
            ])
        ]),
    ]
})
export class PreviewPage implements OnInit {

    theme: string;

    ui = {
        redTable: false,
        redDishes: false,

        showPlace: false,
        showSelectTable: false,
        showDishes: false,
        showPay: false,
        showComment: false,
    }

    constructor(
        private router: RouterService,
        private service: CustomerService,
        public order: OrderService,
        private toastCtrl: ToastController,
        private route: ActivatedRoute,
        private injector: Injector,
        private alertCtrl: AlertController,
    ) {

    };

    @ViewChild("dishModalContainer", { read: ViewContainerRef }) dishModal: ViewContainerRef;
    @ViewChild("commentModalContainer", { read: ViewContainerRef }) commentModal: ViewContainerRef;
    @ViewChild("tableConfirmModalContainer", { read: ViewContainerRef }) tableConfirmModal: ViewContainerRef;
    @ViewChild("tableScanModalContainer", { read: ViewContainerRef }) tableScanModal: ViewContainerRef;
    @ViewChild("commentTextarea") commentTextarea: ElementRef;

    @Output() leave = new EventEmitter();

    
    close() {
        this.leave.emit();
    }

    //
    //  CHOOSE TABLE
    //
    async table() {

        const { TableComponent } = await import("./table/table.component");

        const component = this.tableScanModal.createComponent(TableComponent);


        component.instance.leave.subscribe(async (table: string) => {

            if(table) {
                const update: { updated: boolean; confirm: boolean; } = await this.service.post({ table: table, force: false, }, "order", this.service.restaurantId, "session/table");

                if(update.confirm) {
                    const result = await this.confirmTable();

                    if(result) {
                        const update: { updated: boolean; confirm: boolean; } = await this.service.post({ table: table, force: true, }, "order", this.service.restaurantId, "session/table");

                        if(update.updated) {
                            this.order.id = table;
                        }
                    }
                } else {
                    this.order.id = table;
                }

            }

            component.destroy();
        });
    }
    async confirmTable() {
        const alert = await this.alertCtrl.create({
            header: "Oops...",
            subHeader: "Seems like someone is on the table, do you want to continue?",
            mode: "ios",
            buttons: [
                {
                    text: "Cancel",
                },
                {
                    text: "Continue",
                    role: "continue",
                }
            ]
        });

        await alert.present();

        const { role } = await alert.onDidDismiss();

        if (role == "continue") {
            return true;
        }
        return false;
    }


    //
    //  CHOOSE ORDER TYPE
    //
    async place(p: "takeout" | "dinein") {
        let old = this.order.type;
        this.order.id = null;
        this.order.type = p;
        
        this.ui.showSelectTable = p == "dinein";
        
        try {
            const result: any = await this.service.post({ type: p }, "order", this.service.restaurantId, "session", "type");

            if (!result.updated) {
                this.order.type = old;
                (await this.toastCtrl.create({
                    duration: 1500,
                    color: "red",
                    message: "Something went wrong. Please try again",
                    mode: "ios",
                })).present();
            } else {
                if (p == "takeout") {
                    this.order.id = result.id;
                }
            }
        } catch (err) {
            if (err.status == 403) {
                this.order.type = old;
            }
        }

    }


    //
    //  SEE ALL CHOSEN DISHES
    //
    async seeAllDishes(id: string) {
        const { DishComponent } = await import("./dish/dish.component");

        const component = this.dishModal.createComponent(DishComponent, { injector: this.injector });
        component.instance.dishId = id;

        component.instance.leave.subscribe((full: boolean) => {
            component.destroy();
            if (full) {
                this.close();
            }
        });
    }


    //
    //  ADD COMMENT TO THE ORDER
    //
    async comment() {
        this.commentTextarea.nativeElement.blur();
        const { CommentComponent } = await import("./comment/comment.component");

        const component = this.commentModal.createComponent(CommentComponent, { injector: this.injector });

        component.instance.comment = this.order.comment;

        component.instance.done.subscribe(async res => {
            if (res) {
                try {
                    const result: any = await this.service.post({ comment: res }, "order", this.service.restaurantId, "session", "comment");

                    if (!result.updated) {
                        (await this.toastCtrl.create({
                            mode: "ios",
                            color: "red",
                            message: "Something went wrong adding comment. Please try again",
                            duration: 1500,
                        })).present();
                    } else {
                        this.order.comment = res;
                    }
                } catch (e) {
                    if (e.status == 422) {
                        throw "422 Unproccesable entity";
                    }
                }
            }

            component.destroy();
        });
    }


    //
    //  PAY
    //
    pay() {
        if (this.order.dishes.length == 0) {
            this.ui.redDishes = true;
            return;
        }
        if (this.order.type == 'dinein' && !this.order.id) {
            this.ui.redTable = true;
            return;
        }

        this.router.go(["customer", "order", this.service.restaurantId, "checkout"]);
    }



    async ngOnInit() {
        this.theme = this.service.theme;

        this.ui.showSelectTable = this.order.type == 'dinein' && this.order.settings.allowOrderingOnline;
        this.ui.showComment = this.order.settings.allowOrderingOnline;
        this.ui.showDishes = true;
        this.ui.showPay = this.order.settings.allowOrderingOnline;
        this.ui.showPlace = this.order.settings.allowOrderingOnline;
    }
}
