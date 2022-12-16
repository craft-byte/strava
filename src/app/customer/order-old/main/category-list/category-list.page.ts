import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerService } from 'src/app/customer/customer.service';
import { LoadService } from 'src/app/other/load.service';
import { general } from 'src/assets/consts';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.page.html',
  styleUrls: ['./category-list.page.scss'],
})
export class CategoryListPage implements OnInit {

  dishes: any;
  category: string;

  constructor(
    private loader: LoadService,
    private route: ActivatedRoute,
    private service: CustomerService,
  ) { }

  async ngOnInit() {
    const category = this.route.snapshot.paramMap.get("category");
    for(let i of general) {
      if(i.value == category) {
        this.category = i.title;
        break;
      }
    }

    const result: any = await this.service.get({}, "order", this.service.restaurantId, "dishes", category);
    
    this.dishes = result;

    this.loader.end();
  }

}
