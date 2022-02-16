import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Dish } from 'src/models/dish';
import { Restaurant } from 'src/models/radmin';
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

  constructor(
    private service: RadminService,
    private router: Router
  ) {
  }

  addDish() {
    this.router.navigate(["dish", "add"], { queryParams: { restaurant: this.restaurant._id, last: "overview" }, replaceUrl: true });
  }

  ionInput(e: any) {
    this.searchText = e.target.value;
  }
  async find() {
    this.dishes = await this.service.patch({ name: this.searchText }, 'search', 'dishes', this.restaurant.sname);
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
        console.log("EDITING");
        this.router.navigate(["dish/edit"], { queryParams: { dish: _id, restaurant: this.restaurant._id }, replaceUrl: true });
        break;
    }
  }


  async ngOnInit() {
    this.restaurant = await this.service.getRestaurant();
    this.dishes = await this.service.get("dishes", this.time.toString(), this.restaurant.sname);
  }


}
