import { ForwardRefHandling } from '@angular/compiler';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CustomerService } from '../customer/customer.service';
import { OrderService } from '../customer/order/order.service';
import { RouterService } from '../other/router.service';
import { SequentialRoutingGuardService } from '../other/sequential-routing-guard.service';

@Injectable({
  providedIn: 'root'
})
export class OrderGuard implements CanActivate {

  constructor(
    private service: CustomerService,
    private router: RouterService,
    private sequentialRoutingGuardService: SequentialRoutingGuardService,
    private order: OrderService,
    private toastCtrl: ToastController,
  ) {};

  async toast() {
    (await this.toastCtrl.create({
      duration: 1500,
      message: "You're not allowed to be there.",
      color: "green",
      mode: "ios",
    })).present();
  }


  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    const restaurantId = route.paramMap.get("restaurantId");
    
    const rid = restaurantId.split("?")[0];
    this.service.restaurantId = rid;

    const observalbe = new Observable<boolean>(subs => {
      if(!this.order.socketId) {
        console.log("ORDER  SOCKET ID DOES NOT EXITST");
        this.order.socket.connect();
        this.order.socket.on("connect", () => {
          console.log("ORDER  SOCKET ON CONNECT");
          this.service.getobs<{ theme: string; }>({ socketId: this.order.socketId }, "order", rid, "check")
          .pipe(
            catchError(err => {
              if(err.status == 404) {
                this.router.go(["customer", "scan"]);
              } else if(err.status == 403) {
                this.router.go(["customer", "scan"]);
                this.toast()
              }

              return throwError(err.status);
            })
          )
          .subscribe(res => {
            if(res) {
              this.service.theme = res.theme;
              subs.next(true);
            } else {
              this.router.go(["customer/scan"]);
            }
          });
        });
      } else {
        console.log("ORDER  SOCKET ID EXITST");
        this.service.getobs<{ theme: string; }>({ socketId: this.order.socketId }, "order", rid, "check").pipe(
          catchError(err => {
            if(err.status == 404) {
              this.router.go(["customer", "scan"]);
            } else if(err.status == 403) {
              this.router.go(["customer", "scan"]);
              this.toast()
            }

            return throwError(err.status);
          })
        ).subscribe(res => {
          if(res) {
            this.service.theme = res.theme;
            subs.next(true);
          } else {
            this.router.go(["customer/scan"]);
          }
        });
      }
    });

    return this.sequentialRoutingGuardService.queue(
      route,
      observalbe
    );

  }
}
