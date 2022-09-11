import { Component, Input, OnInit } from '@angular/core';
import { CustomerService } from 'src/app/customer/customer.service';
import { RouterService } from 'src/app/other/router.service';
import { general } from 'src/assets/consts';
import { getImage } from 'src/functions';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit {

  image: string;
  imageClass: string;

  category: string;

  constructor(
    private service: CustomerService,
    private router: RouterService,
  ) { };


  @Input() dish: any;
  @Input() useLast: boolean;
  @Input() showCategory: boolean;


  go() {
    this.router.go(["customer", "order", this.service.restaurantId, "dish", this.dish._id], { queryParamsHandling: "merge", queryParams: { last: this.useLast ? this.router.url : null } });
  }

  async ngOnInit() {
    if(!this.dish.image) {
      this.dish.image = await this.service.get({}, "order", this.service.restaurantId, "dish-image", this.dish._id);
    }

    for(let i of general) {
      if(i.value == this.dish.category) {
        this.category = i.title;
        break;
      }
    }

    this.image = getImage(this.dish.image.binary);
    if(this.dish.image.resolution == 1) {
      this.imageClass = "r1";
    } else if(this.dish.image.resolution == 1.33) {
      this.imageClass = "r2";
    } else if(this.dish.image.resolution == 1.77) {
      this.imageClass = "r3";
    }
  }

}
