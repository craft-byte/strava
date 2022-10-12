import { Component, Injector, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { general } from 'src/assets/consts';
import { getImage } from 'src/functions';
import { RestaurantService } from '../services/restaurant.service';


interface Dish {
    name: string;
    info: { time: number; };
    price: number;
    image: { binary: any; resolution: any; };
    general: string;
    description: string;
    _id: string;
}



@Component({
    selector: 'app-dish-edit',
    templateUrl: './dish-edit.page.html',
    styleUrls: ['./dish-edit.page.scss'],
})
export class DishEditPage implements OnInit {

    form: FormGroup;
    categories = general;

    imageChanged: any;
    image: string;
    imageClass: string = "r1";

    dish: Dish;

    ui = {
        nameRed: false,
        priceRed: false,
    }

    constructor(
        private router: RouterService,
        private loader: LoadService,
        private route: ActivatedRoute,
        private service: RestaurantService,
        private injector: Injector,
        private toastCtrl: ToastController,
    ) { };

    @ViewChild("imageModalContainer", { read: ViewContainerRef }) imageModal: ViewContainerRef;


    /**
     * opens image modal
     */
     async setImage() {
        const { ImageModalComponent } = await import("./image-modal/image-modal.component");

        const component = this.imageModal.createComponent(ImageModalComponent, { injector: this.injector });

        component.instance.leave.subscribe((img: any) => {
            if(img) {
                this.imageChanged = img;
                this.image = img.binary;
                this.imageClass = img.resolution == 1 ? "r1" : img.resolution == 1.33 ? "r2" : "r3";
            }
            component.destroy();
        });
    }

    /**
     * 
     * POST /restaurant/dishes/{{dishid}}/
     * 
     */
    async save() {
        if(!this.form.valid) {
            return;
        }
        const body = this.form.value;

        if(this.imageChanged) {
            body.image = this.imageChanged;
        }

        try {
            const result: { updated: boolean; } = await this.service.post(body, "dishes", this.dish._id);
            
            if(result.updated) {
                this.back();
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
        await this.loader.start();

        try {
            const dishId = this.route.snapshot.paramMap.get("dishId");
            this.dish = await this.service.get<Dish>({ mode: "edit" }, "dishes", dishId);

            if(!this.dish) {
                return;
            }

            this.form = new FormGroup({
                name: new FormControl(this.dish.name, Validators.required),
                price: new FormControl(this.dish.price, Validators.required),
                time: new FormControl(this.dish.info.time),
                description: new FormControl(this.dish.description),
                category: new FormControl(this.dish.general, Validators.required),
            });

            this.image = getImage(this.dish.image.binary);
            this.imageClass = this.dish.image.resolution == 1 ? "r1" : this.dish.image.resolution == 1.33 ? "r2" : "r3";
        } catch (e) {
            this.back();
        }

        this.loader.end();
    }



    back() {
        if(this.dish) {
            this.router.go(["restaurant", this.service.restaurantId, "dishes", "full", this.dish._id]);
        } else {
            this.router.go(["restaurant", this.service.restaurantId, "dishes", "list"]);
        }
    }
}
