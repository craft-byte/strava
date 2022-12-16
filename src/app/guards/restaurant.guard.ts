import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { StripeInstance } from 'ngx-stripe';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RouterService } from '../other/router.service';
import { SequentialRoutingGuardService } from '../other/sequential-routing-guard.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { MainService } from '../other/main.service';

@Injectable({
    providedIn: 'root'
})
export class RestaurantGuard implements CanActivate {
    constructor(
        private service: RestaurantService,
        private router: RouterService,
        private main: MainService,
        private sequentialRoutingGuardService: SequentialRoutingGuardService,
    ) { };


    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

        const observable = new Observable<boolean>(subs => {

            // if there's no main user we can't check if the user is part of the restaurant
            if (!this.main.user) {
                return subs.next(false);
            }


            const restaurantId = route.paramMap.get("restaurantId");

            // ObjectId is 24 chars length
            if (restaurantId.length != 24) {
                this.router.go(["user/info"], { replaceUrl: true });
                return subs.next(false);
            }

            // if main.user.restaurants doesn't have the restaurant, user is not part of it or should restart the page to update main.user
            if(!this.main.user.restaurants.find(r => r.restaurantId == restaurantId)) {
                this.router.go(["user/info"]);
                return subs.next(false);
            }

            if(!this.service.restaurant) {
                this.service.init(restaurantId).then(() => {
                    subs.next(true);
                });
                return;
            }

            subs.next(true);
        });

        return this.sequentialRoutingGuardService.queue(route, observable);
    }

}
