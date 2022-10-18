import { Component, Injector, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { general } from 'src/assets/consts';
import { RestaurantService } from '../services/restaurant.service';

@Component({
    selector: 'app-dish-add',
    templateUrl: './dish-add.page.html',
    styleUrls: ['./dish-add.page.scss'],
})
export class DishAddPage implements OnInit {

    categories = general;
    imageClass = "r3";
    image: any;

    form: FormGroup;

    ui = {
        nameRed: false,
        priceRed: false,
    }

    constructor(
        private router: RouterService,
        private service: RestaurantService,
        private loader: LoadService,
        private injector: Injector,
        private toastCtrl: ToastController,
    ) { };

    @ViewChild("imageModalContainer", { read: ViewContainerRef }) imageModal: ViewContainerRef;


    back() {
        this.router.go(["restaurant", this.service.restaurantId, "dishes", "list"]);
    }

    /**
     * opens image modal
     */
    async setImage() {
        const { ImageModalComponent } = await import("./image-modal/image-modal.component");

        const component = this.imageModal.createComponent(ImageModalComponent, { injector: this.injector });

        component.instance.leave.subscribe((img: any) => {
            if(img) {
                this.image = img;
                this.imageClass = img.resolution == 1 ? "r1" : img.resolotion == 1.33 ? "r2" : "r3";
            }
            component.destroy();
        });
    }


    /**
     * saves dish POST /restaurant/dishes
     */
    async submit() {
        if(!this.form.valid) {
            return;
        }
        const { description, name, price, time, category, } = this.form.value;
        if(name.length > 30) {
            this.ui.nameRed = true;
            return;
        } else if(price < 1) {
            this.ui.priceRed = true;
            return;
        }

        const body = {
            description,
            name,
            price: price * 100,
            time,
            category,
            image: this.image
        };

        try {
            const result: any = await this.service.post(body, "dishes");

            if(result.added) {
                this.router.go(["restaurant", this.service.restaurantId, "dishes", "list"]);
            } else {
                (await this.toastCtrl.create({
                    duration: 1500,
                    color: "red",
                    message: "Something went wrong. Please try again.",
                    mode: "ios",
                })).present();
            }
        } catch (e) {
            if(e.status == 422) {
                if(e.body.reason == "InvalidDishName") {
                    this.ui.nameRed = true;
                    return;
                } else if(e.body.reason == "InvalidDishPrice") {
                    this.ui.priceRed = true;
                    return;
                } else if(e.body.reason == "InvalidDishImage") {
                    this.setImage();
                    (await this.toastCtrl.create({
                        duration: 1500,
                        color: "red",
                        mode: "ios",
                        message: "Image is invalid. Please try again upload your image.",
                    })).present();
                }
            }
        }
    }

    async ngOnInit() {

        this.form = new FormGroup({
            name: new FormControl(null, Validators.required),
            price: new FormControl(null, Validators.required),
            category: new FormControl(null, Validators.required),
            description: new FormControl(null),
            time: new FormControl(null),
        });

        this.loader.end();
    }

}
