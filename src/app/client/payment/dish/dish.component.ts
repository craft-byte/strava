import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { CustomerService } from '../../customer.service';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({opacity: 0}),
          animate('250ms', style({opacity: 1}))
        ]),
        transition(':leave', [
          style({opacity: 1}),
          animate('250ms', style({opacity: 0}))
        ])
      ]
    )
  ]
})
export class DishComponent implements OnInit {

  menu = false;

  constructor(
    private service: CustomerService
  ) {   }

  dish: { name: string, price: number };
  @Input() data: { dish: string, quantity: number };
  
  remove() {
    for(let i in this.service.dishes) {
      if(this.service.dishes[i].dish == this.data.dish) {
        this.service.dishes[i].quantity--;
        this.service.totalPrice -= this.dish.price;
        if(this.service.dishes[i].quantity == 0) {
          this.service.dishes.splice(+i, 1);
        }
        this.service.setDishes();
        return;
      }
    }
  }
  add() {
    for(let i in this.service.dishes) {
      if(this.service.dishes[i].dish == this.data.dish) {
        this.service.dishes[i].quantity++;
        this.service.totalPrice += this.dish.price;
        localStorage.setItem("CTRABANOTABLESESSIONDISHES", JSON.stringify(this.service.dishes));
        break;
      }
    }
  }

  open() {
    this.menu = !this.menu;
  }

  async ngOnInit() {
    this.dish = await this.service.get("dishes/small", [this.service.restaurant, this.data.dish]);
    this.service.totalPrice += this.dish.price * this.data.quantity;
    if(this.dish.hasOwnProperty("error")) {
      const error = (((this.dish as unknown) as { error: string }).error);
      console.log(error);
      localStorage.setItem("CTRABANOTABLESESSIONDISHES", "[]");
      if(error === "notfound") {
        this.dish = null;
        for(let i in this.service.dishes) {
          if(i === this.data.dish) { 
            this.service.dishes.splice(+i, 1);
          }
        }
      }
    }
  }

}
