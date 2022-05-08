import { Component, OnInit } from '@angular/core';
import { RadminService } from '../../radmin.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
})
export class CustomersComponent implements OnInit {

  orders: any[] = [];
  restaurantId: string;

  ui = {
    showOrders: false,
    showNoOrders: false,
  }

  constructor(
    private service: RadminService
  ) { }

  async ngOnInit() {
    this.restaurantId = this.service.restaurantId;
    this.orders = await this.service.get("orders");

    if(this.orders.length > 0) {
      this.ui.showOrders = true;
    } else {
      this.ui.showNoOrders = true;
    }
  }

}
