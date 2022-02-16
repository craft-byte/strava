import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Confirm, Custom } from 'src/models/customer';
import { OrderRemove, Take, TakeAndDone } from 'src/models/staff';
import { StaffService } from '../staff.service';

@Component({
  selector: 'app-kitchen',
  templateUrl: './kitchen.page.html',
  styleUrls: ['./kitchen.page.scss'],
})
export class KitchenPage implements OnInit, OnDestroy {

  subscription: Subscription;
  username: string;
  orders: Custom[] = [];

  constructor(
    private service: StaffService
  ) {
    this.username = this.service.username
  }


  ngOnInit() {
    if (!this.service.restaurant) {
      this.service.go({}, "staff-login");
      return;
    }
    this.subscription = this.service.kitchen().subscribe(res => {
      const { type } = res;

      if (type === "kitchen/new" || type === "kitchen/init") {
        const data = res.data as Confirm[];
        this.orders.push(...data);
      } else if (type === "kitchen/dish/done") {
        const { _id, orderId, types } = res.data as TakeAndDone;
        for (let o of this.orders) {
          if (o._id === orderId) {
            for (let i in o.dishes) {
              if ((o.dishes[i]._id as string) === _id) {
                o.dishes.splice(+i, 1);
                break;
              }
            }
            for(let i of types) {
              for(let j in o.types) {
                if(i === o.types[j].n) {
                  o.types[j].q--;
                  if(o.types[j].q === 0) {
                    o.types.splice(+j, 1);
                    break;
                  }
                }
              }
            }
          }
        }
      } else if (type === "kitchen/dish/take") {
        const { orderId, _id, by } = res.data as Take;
        for (let o of this.orders) {
          if (o._id === orderId) {
            for (let i in o.dishes) {
              if ((o.dishes[i]._id as string) === _id) {
                o.dishes[i].taken = by;
                break;
              }
            }
          }
        }
      } else if (type === "kitchen/dish/untake") {
        const { orderId, _id } = res.data as Take;
        for (let o of this.orders) {
          if (o._id === orderId) {
            for (let i in o.dishes) {
              if ((o.dishes[i]._id as string) === _id) {
                o.dishes[i].taken = null;
                break;
              }
            }
          }
        }
      } else if (type === "kitchen/dish/remove") {
        const { orderId, _id } = res.data as Take;
        for (const i of this.orders) {
          if (i._id === orderId) {
            for (let j in i.dishes) {
              if (i.dishes[j]._id === _id) {
                i.dishes.splice(+j, 1);
                return;
              }
            }
          }
        }
      } else if (type === "kitchen/order/remove") {
        const { orderId } = res.data as OrderRemove;

        for (let i in this.orders) {
          if (this.orders[i]._id === orderId) {
            this.orders.splice(+i, 1);
            break;
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
