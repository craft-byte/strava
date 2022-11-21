import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from '../../restaurant.service';


interface Dish {
    name: string;
    date: string;
    _id: string;
    price: number;
    bought: number;
    modified: string;
}



@Component({
    selector: 'app-dishes-list',
    templateUrl: './dishes-list.component.html',
    styleUrls: ['./dishes-list.component.scss'],
})
export class DishesListComponent implements OnInit {

    routerSubs: Subscription;
    dishes: Dish[] = [];

    timeout: any;

    ui = {
        noDishes: false,
        showLoading: true,
        showContent: false,
    };


    lastDishes: any;

    constructor(
        private router: RouterService,
        private service: RestaurantService,
    ) { };

    cancel() {
        this.dishes = [];
    }

    
    addDish() {
        this.router.go(["dish", this.service.restaurantId, "add"], { replaceUrl: true });
    }
    
    goDish(id: string) {
        this.router.go(["restaurant", this.service.restaurantId, "dishes", "full", id], { replaceUrl: true });
    }

    /**
     * 
     * @param { InputEvent } e
     * 
     * makes PATCH /restaurant/dishes/find
     * body has to have searchText property
     */
    find(e?: any) {
        if (!e) {
            return;
        }

        const { target: { value } } = e;

        clearTimeout(this.timeout);

        if (value == "") {
            this.dishes = this.lastDishes;
            this.lastDishes = [];
            return;
        }

        this.timeout = setTimeout(async () => {
            this.ui.showLoading = true;
            this.lastDishes = this.dishes;
            this.dishes = await this.service.patch({ searchText: value }, "dishes", "find");
            this.ui.showLoading = false;
        }, 1000);
    }

    async ngOnInit() {
        this.dishes = await this.service.get({}, 'dishes');
        if (this.dishes.length == 0) {
            this.ui.noDishes = true;
        }
        this.ui.showContent = true;
        this.ui.showLoading = false;
    }


}
