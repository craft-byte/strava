import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Dish } from 'src/models/dish';
import { Restaurant } from 'src/models/general';
import { RadminService } from '../../radmin.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {

  restaurant: Restaurant;

  searchText = "";

  dishes: Dish[];
  time = 0;

  ui = {
    disableAddButton: true
  }

  constructor(
    private service: RadminService,
    private router: Router,
  ) {
  }

  addDish() {
    this.router.navigate(["dish", this.restaurant._id, "add"], { queryParamsHandling: "preserve", replaceUrl: true });
  }

  ionInput(e: any) {
    this.searchText = e.target.value;
  }
  async find() {
    this.dishes = await this.service.patch({ name: this.searchText }, 'search', 'dishes', this.restaurant._id);
  }

  onDishEmit({ t, _id }: { t: "remove" | "edit", _id?: string}) {
    switch (t) {
      case "remove":
        for(let i in this.dishes) {
          if(this.dishes[i]._id === _id) {
            this.dishes.splice(+i , 1);
            break;
          }
        }
        break;
      case "edit":
        this.router.navigate(["dish/edit"], { queryParams: { dish: _id, restaurant: this.restaurant._id }, replaceUrl: true });
        break;
    }
  }


  async ngOnInit() {
    this.restaurant = await this.service.getRestaurant();
    this.dishes = await this.service.get("dishes", "overview", this.time.toString());    
  }


}
