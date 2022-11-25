import { query } from '@angular/animations';
import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
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
        private route: ActivatedRoute,
        private toastCtrl: ToastController,
    ) { };

    async toast() {
        (await this.toastCtrl.create({
            duration: 1500,
            message: "You're not allowed to be there.",
            color: "green",
            mode: "ios",
        })).present();
    }


    check(restaurantId: string, socketId: string, token: string, route: ActivatedRouteSnapshot) {
        return new Observable<boolean>(subs => {
            this.service.getobs
                <{ token: string; status: "noinfo" | "loggedin" | "loggedout"; settings: any; theme: any; name: any; }>
                ({
                    socketId: socketId,
                    customerToken: token,
                },
                    "order", restaurantId, "check")
                .pipe(
                    catchError(err => {
                        if (err.status == 404) {
                            this.router.go(["customer", "scan"]);
                        } else if (err.status == 403) {
                            this.router.go(["customer", "scan"]);
                            this.toast()
                        }

                        subs.next(false);

                        return throwError(err.status);
                    })
                )
                .subscribe(res => {
                    if (res) {
                        this.order.us = res.status;
                        this.order.settings = res.settings;
                        this.service.theme = res.theme;

                        localStorage.setItem("ct", res.token);
                        subs.next(true);
                        if (res.status == "noinfo" && (!token || token != res.token)) {
                            // has to be after subs.next() because this.route is not inited yet. after subs.next() this.route inits and function below will just add a query param
                            // if put before subs.next() it would navigate to 'domain.com/?ct=customerToken'
                            this.router.go([], { relativeTo: this.route, replaceUrl: false, queryParams: { ct: res.token }, queryParamsHandling: "merge", }, false);
                        }
                    } else {
                        this.router.go(["customer/scan"]);
                        subs.next(false);
                    }
                });
        })
    }



    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

        const restaurantId = route.paramMap.get("restaurantId");

        const rid = restaurantId.split("?")[0];
        this.service.restaurantId = rid;

        const qct = route.queryParamMap.get("ct");

        const observalbe = new Observable<boolean>(subs => {
            if (!this.order.socketId) {
                this.order.socket.connect();
                this.order.socket.on("connect", () => {
                    this.check(rid, this.order.socketId, qct, route).subscribe(pass => subs.next(pass));
                });
            } else {
                this.check(rid, this.order.socketId, qct, route).subscribe(pass => subs.next(pass));
            }
        });

        return this.sequentialRoutingGuardService.queue(
            route,
            observalbe
        );

    }
}




// this.service.getobs
                //     <{ token: string; status: "noinfo" | "loggedin" | "loggedout"; }>
                //     ({
                //         socketId: this.order.socketId,
                //         customerToken: localStorage.getItem("ct") || route.queryParamMap.get("ct")
                //     },
                //         "order", rid, "check")
                //     .pipe(
                //         catchError(err => {
                //             if (err.status == 404) {
                //                 this.router.go(["customer", "scan"]);
                //             } else if (err.status == 403) {
                //                 this.router.go(["customer", "scan"]);
                //                 this.toast()
                //             }

                //             return throwError(err.status);
                //         })
                //     ).subscribe(res => {
                //         if (res) {
                //             if (res.status == "noinfo" && (!route.queryParamMap.get("ct") || route.queryParamMap.get("ct") != res.token)) {
                //                 localStorage.setItem("ct", res.token);
                //                 this.router.go([], { relativeTo: this.route, queryParams: { ct: res.token }, queryParamsHandling: "merge" }, false);
                //             }
                //             this.order.us = res.status;
                //             subs.next(true);
                //         } else {
                //             this.router.go(["customer/scan"]);
                //         }
                //     });