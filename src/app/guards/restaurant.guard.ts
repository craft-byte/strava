import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RouterService } from '../other/router.service';
import { SequentialRoutingGuardService } from '../other/sequential-routing-guard.service';
import { RestaurantService } from '../restaurant/services/restaurant.service';
import { MainService } from '../services/main.service';

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
      if (!this.main.user) {
        return subs.next(false);
      }

      const restaurantId = route.paramMap.get("restaurantId");


      if (restaurantId.length != 24) {
        this.router.go(["user/info"], { replaceUrl: true });
        return subs.next(false);
      }

      this.service.init(restaurantId)
      .pipe(
        catchError(err => {
          if(err.status == 403) {
            this.router.go(["user/info"]);
            return;
          } else if(err.status == 404) {
            this.router.go(["user/info"]);
            return;
          }
          return throwError(err);
        })
      ).subscribe((res: any) => {
        if (!res) {
          this.router.go(["user/info"], { replaceUrl: true })
          return subs.next(false);
        }

        // this.service.restaurant = res.restaurant;
        // this.service.restaurants = res.restaurants;
        // this.service.showGoWork = res.showGoWork;
        return subs.next(true);
      });
    });

    return this.sequentialRoutingGuardService.queue(route, observable);
  }

}
