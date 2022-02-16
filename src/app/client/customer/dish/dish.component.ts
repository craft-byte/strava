import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getImage } from 'src/functions';
import { Dish } from 'src/models/customer';
import { CustomerService } from '../../customer.service';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit {

  dish: Dish;
  type: string;
  image: string;

  liked = false;

  constructor(
    private service: CustomerService,
    private router: Router
  ) { }

  @Input() id: string;

  more() {
    this.service.currentDish = this.dish;
    this.router.navigate([`dish-more/${this.id}`]);
  }


  async ngOnInit() {
    this.dish = await this.service.get("dishes/full", [this.service.restaurant, this.id]);
    this.image = await getImage(this.dish.image);
    this.type = this.service.dtype;
    console.log(this.type)
  }

}
