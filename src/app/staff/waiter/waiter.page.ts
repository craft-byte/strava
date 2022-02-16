import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ForWaiter, Take, TakeAndDone, WaiterNewDish } from 'src/models/staff';
import { StaffService } from '../staff.service';

@Component({
  selector: 'app-waiter',
  templateUrl: './waiter.page.html',
  styleUrls: ['./waiter.page.scss'],
})
export class WaiterPage implements OnInit, OnDestroy {

  subscription: Subscription;

  orders: ForWaiter[] = [];

  constructor(
    private service: StaffService
  ) { };



  ngOnInit() {
    if(!this.service.restaurant) {
      this.service.go({}, "staff-login");
      return;
    }
    this.subscription = this.service.waiter().subscribe(res => {
      const { type } = res;

      if(type === "waiter/new" || type === "waiter/init") {
        const data = res.data as ForWaiter[];
        this.orders.push(...data);
      } else if(type === "waiter/dish/new") {
        const { dish, orderId } = res.data as WaiterNewDish;

        for(let o of this.orders) {
          if(o._id === orderId) {
            o.dishes.push(dish);
            o.dishesLength--;
            break;
          }
        }
      } else if(type === "waiter/dish/done") {
        const { _id, orderId } = res.data as TakeAndDone;
        for(let o in this.orders) {
          if(this.orders[o]._id === orderId) {
            for(let i in this.orders[o].dishes) {
              if(this.orders[o].dishes[i]._id === _id) {
                this.orders[o].dishes.splice(+i, 1);
                if(this.orders[o].dishesLength === 0 && this.orders[o].type === "table") {
                  this.orders.splice(+o, 1);
                  return;
                }
              }
            }
          }
        }
      } else if(type === "waiter/dish/remove") {
        const { orderId } = res.data as Take;
        for(let i of this.orders) {
          if(i._id === orderId) {
            i.dishesLength--;
            if(i.dishesLength === 0) {
              this.service.waiterFullDone(i._id);
            }
            return;
          }
        }
      } else if(type === "waiter/order/done") {
        const { orderId } = res.data as { orderId: string };

        for(let i in this.orders) {
          if(this.orders[i]._id === orderId) {
            this.orders.splice(+i, 1);
            return;
          }
        }
      } else if(type === "waiter/order/remove") {
        const { orderId } = res.data as { orderId: string };

        for(let i in this.orders) {
          if(this.orders[i]._id === orderId) {
            this.orders.splice(+i, 1);
            return;
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if(this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
