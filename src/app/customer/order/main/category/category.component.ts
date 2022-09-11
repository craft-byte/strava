import { Component, Input, OnInit } from '@angular/core';
import { CustomerService } from 'src/app/customer/customer.service';
import { RouterService } from 'src/app/other/router.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
})
export class CategoryComponent implements OnInit {

  constructor(
    private router: RouterService,
    private service: CustomerService,
  ) { };

  @Input() data: any;

  go() {
    this.router.go(["customer", "order", this.service.restaurantId, "category", this.data.value], { queryParamsHandling: "preserve" });
  }

  ngOnInit() {}

}
