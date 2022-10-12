import { Component, OnInit } from '@angular/core';
import { CustomerService } from 'src/app/customer/customer.service';
import { LoadService } from 'src/app/other/load.service';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.page.html',
  styleUrls: ['./recommendations.page.scss'],
})
export class RecommendationsPage implements OnInit {

  dishes: any;

  constructor(
    private loader: LoadService,
    private service: CustomerService,
  ) { }

  async ngOnInit() {
    const result: any = await this.service.get({}, "order", this.service.restaurantId, "recommendations");

    const { dishes } = result;

    this.dishes = dishes;

    this.loader.end();
  }

}
