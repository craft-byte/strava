import { Component, OnInit } from '@angular/core';
import { Restaurant } from 'src/models/general';
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
    this.settings = await this.service.get('settings');
    this.restaurant = await this.service.getRestaurant();
  }

}
