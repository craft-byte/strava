import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Restaurant } from 'src/models/general';
import { RadminService } from '../../radmin.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {

  restaurant: Restaurant;
  warning: any[] = [];

  ui = {
    showWarning: false
  }

  constructor(
    private router: Router,
    private service: RadminService
  ) { };


  go(id: string) {
    this.router.navigate(["restaurant", this.restaurant._id, "cooking", "components", "more", id], { replaceUrl: true, queryParamsHandling: "preserve" });
  }

  async ngOnInit() {
    this.restaurant = await this.service.getRestaurant();

    const { warning } = await this.service.get("components");
    
    if(warning && warning.length > 0) {
      this.ui.showWarning = true;
      this.warning = warning;
    }
  }

}
