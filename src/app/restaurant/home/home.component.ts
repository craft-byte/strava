import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Restaurant } from 'src/models/general';
import { RadminService } from '../radmin.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  restaurant: Restaurant;

  ui = {
    showTutorials: false,
  }

  constructor(
    private service: RadminService,
    private router: Router,
    private route: ActivatedRoute
  ) {  };

  go(page: "dishes" | "staff" | "cooking") {
    if(page == "staff") {
      return this.router.navigate(["restaurant", this.restaurant._id, "people", page], { queryParamsHandling: "preserve" });
    }
    this.router.navigate(["restaurant", this.restaurant._id, page], { queryParamsHandling: "preserve" });
  }


  async noTutorials() {
    const result = await this.service.delete("removeTutorials", this.restaurant._id);
    if(result) {
      this.restaurant.tutorials = null;
    }
  }


  async ngOnInit() {
    this.restaurant = await this.service.getRestaurant();
    this.ui.showTutorials = this.service.role == "a";
  }

}
