import { Component, OnInit } from '@angular/core';
import { Restaurant } from 'src/models/general';
import { RestaurantSettings } from 'src/models/components';
import { RadminService } from '../../radmin.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {

  restaurant: Restaurant;
  settings: RestaurantSettings;

  constructor(
    private service: RadminService
  ) { };

  set(t: string) {
    if(this.settings.dishes[t] !== this.restaurant.settings.dishes[t]) {
      this.restaurant.settings.dishes[t] = this.settings.dishes[t];
      this.service.patch({ setTo: this.restaurant.settings.dishes[t] }, "settings", this.restaurant._id, "dishes", t);
    }
  }

  async ngOnInit() {
    this.restaurant = await this.service.getRestaurant();
    this.settings = JSON.parse(JSON.stringify(this.restaurant.settings));
  }

}
