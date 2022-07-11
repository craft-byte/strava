import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {

  restaurants: { _id: string; name: string; }[];

  constructor(
    private popoverCtrl: PopoverController,
    private service: RestaurantService,
  ) { };

  tutorials() {
    this.popoverCtrl.dismiss(null, '2')
  }
  user() {
    this.popoverCtrl.dismiss(null, "1");
  }

  go(id: string) {
    this.popoverCtrl.dismiss(id);
  }

  async ngOnInit() {
    this.restaurants = this.service.restaurants;
  }

}
