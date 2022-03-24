import { Component, OnInit } from '@angular/core';
import { Restaurant } from 'src/models/radmin';
import { RadminService } from '../../radmin.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {

  settings: any = null;
  restaurant: Restaurant = null;

  constructor(
    private service: RadminService
  ) { };

  set(obj: string) {
    if(this.settings.customers[obj] != this.restaurant.settings.customers[obj]) {
      this.service.patch({ setTo: this.settings.customers[obj] }, "settings", this.restaurant._id, "customers", obj);
      this.restaurant.settings.customers[obj] = this.settings.customers[obj];
    }
  }

  async ngOnInit() {
    this.restaurant = await this.service.getRestaurant("settings");
    this.settings = JSON.parse(JSON.stringify(this.restaurant.settings));
  }

}
