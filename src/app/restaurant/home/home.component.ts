import { Component, OnInit } from '@angular/core';
import { Restaurant } from 'src/models/radmin';
import { RadminService } from '../radmin.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  restaurant: Restaurant;

  constructor(
    private service: RadminService,
  ) {  }

  async ngOnInit() {
    this.restaurant = await this.service.getRestaurant();
  }

}
