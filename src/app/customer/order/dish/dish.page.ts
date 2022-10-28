import { Component, Injector, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { general } from 'src/assets/consts';
import { getImage } from 'src/functions';
import { CustomerService } from '../../customer.service';
import { OrderService } from '../order.service';

@Component({
    selector: 'app-dish',
    templateUrl: './dish.page.html',
    styleUrls: ['./dish.page.scss'],
})
export class DishPage implements OnInit {

    theme: string;

    dish: any;


    image: string = './../../../../assets/images/no-image.jpg';
    imageClass: string;

    category: string;


    constructor(
        private router: RouterService,
        private loader: LoadService,
        private service: CustomerService,
        private route: ActivatedRoute,
        private toastCtrl: ToastController,
        private order: OrderService,
        private injector: Injector,
    ) { };

    @ViewChild("commentModalContainer", { read: ViewContainerRef }) commentModal: ViewContainerRef;

    async add(comment: string = null) {
        this.dish.quantity++;
        this.order.dishesQuantity++;
        try {
            const result: any = await this.service.post(
                { dishId: this.dish._id, comment, userToken: this.order.us == "noinfo" && !!localStorage.getItem("ut") ? localStorage.getItem("ut") : undefined },
                "order", this.service.restaurantId, "session", "dish"
            );

            if (!result.updated) {
                this.dish.quantity--;
                this.order.dishesQuantity--;
                (await this.toastCtrl.create({
                    duration: 1500,
                    color: "red",
                    mode: "ios",
                    message: "Something went wrong adding dish. Please try again",
                })).present();
            } else {
                for (let i of this.order.dishes) {
                    if (i._id == this.dish._id) {
                        i.quantity++;
                        return;
                    }
                }

                this.order.dishes.push({
                    ...result.dish,
                    quantity: 1,
                })
            }
        } catch (e) {
            this.dish.quantity--;
            (await this.toastCtrl.create({
                duration: 1500,
                color: "red",
                mode: "ios",
                message: "Something went wrong adding dish. Please try again",
            })).present();
            if (e.status == 422 || e.status == 404) {
                this.back();
            }
        }
    }

    async comment() {
        const { CommentModalComponent } = await import("./comment-modal/comment-modal.component");
        const component = this.commentModal.createComponent(CommentModalComponent, { injector: this.injector });
        component.instance.name = this.dish.name;

        component.instance.leave.subscribe(res => {
            if (res) {
                this.add(res)
            }
            component.destroy();
        });
    }

    back() {
        const last = this.route.snapshot.queryParamMap.get("last");
        if (last) {
            this.router.go([last], { queryParamsHandling: "merge", queryParams: { last: null } });
        } else {
            this.router.go(["customer", "order", this.service.restaurantId], { queryParamsHandling: "merge", queryParams: { last: null } });
        }
    }

    async ngOnInit() {
        await this.loader.start();

        this.theme = this.service.theme;

        const dishId = this.route.snapshot.paramMap.get("dishId");

        try {
            const result: any = await this.service.get({}, "order", this.service.restaurantId, "dish", dishId);

            this.dish = result;
            this.theme = result.theme;

            if(this.dish.image) {
                this.image = getImage(this.dish.image.binary) || './../../../../assets/images/no-image.jpg';
    
                if (this.dish.image.resolution == 1) {
                    this.imageClass = "r1";
                } else if (this.dish.image.resolution == 1.33) {
                    this.imageClass = "r2";
                } else if (this.dish.image.resolution == 1.77) {
                    this.imageClass = "r3";
                }
            }
            for (let i of general) {
                if (i.value == this.dish.category) {
                    this.category = i.title;
                    break;
                }
            }
        } catch (err) {
            this.back();
            return;
        }

        this.loader.end();
    }

}
