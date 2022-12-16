import { CommonModule, Location } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from 'src/app/customer/customer.service';
import { RouterService } from 'src/app/other/router.service';
import { general } from 'src/assets/consts';
import { getImage } from 'src/functions';
import { OrderService } from '../../order.service';
import { Dish } from '../../other/models/dish';

@Component({
    selector: 'app-dish',
    templateUrl: './dish.component.html',
    styleUrls: ['./dish.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class DishComponent implements OnInit {

    image: string;
    imageClass: string;

    category: string;

    ui = {
        imageLoading: true,
    }

    constructor(
        private service: CustomerService,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location,
    ) { };


    @Input() dish: Dish;
    @Input() showCategory: boolean;
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async open() {
        // add "d" queryParam so if user reloads the page the dish modal can still be opened later in order.page
        // use the way below to add queryParam without reloading the page
        const url = this.router.createUrlTree([], { relativeTo: this.route, queryParams: { d: this.dish._id }, queryParamsHandling: "merge" }).toString()
        this.location.go(url);


        const { DishModalComponent } = await import("./../dish-modal/dish-modal.component");

        const component = this.modalContainer.createComponent(DishModalComponent);

        component.instance.dish = this.dish;

        component.instance.leave.subscribe(() => {
            // remove "d" queryParam
            const url = this.router.createUrlTree([], { relativeTo: this.route, queryParams: { d: null }, queryParamsHandling: "merge" }).toString()
            this.location.go(url);
        
            // close the modal
            component.destroy();
        });
    }

    async ngOnInit() {

        if (!this.dish.image) {
            try {

                this.dish.image = await this.service.get({}, "order", this.service.restaurantId, "dishImage", this.dish._id);

            } catch (e) {
                console.log(e);
                if(e.status == 404) {
                    if(e.body.reason == "DishNotFound") {
                        this.dish.image = null;
                    }
                }
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
            if (this.dish.image.resolution == 1) {
                this.imageClass = "r1";
            } else if (this.dish.image.resolution == 1.33) {
                this.imageClass = "r2";
            } else if (this.dish.image.resolution == 1.77) {
                this.imageClass = "r3";
            }
        }

        this.ui.imageLoading = false;
    }

}
