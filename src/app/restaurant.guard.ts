import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { SequentialRoutingGuardService } from './other/sequential-routing-guard.service';
import { RestaurantService } from './restaurant/services/restaurant.service';
import { MainService } from './services/main.service';

@Injectable({
  providedIn: 'root'
})
export class RestaurantGuard implements CanActivate {
  constructor(
    private service: RestaurantService,
    private router: Router,
    private main: MainService,
    private sequentialRoutingGuardService: SequentialRoutingGuardService,
  ) { };


  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

    console.log("RESTAURANT GUARD");

    const observable = new Observable<boolean>(subs => {
      if (!this.main.userInfo) {
        return subs.next(false);
      }

      const restaurantId = route.paramMap.get("restaurantId");


      if (restaurantId.length != 24) {
        this.router.navigate(["user/info"], { replaceUrl: true });
        return subs.next(false);
      }

      this.service.init(restaurantId).subscribe((res: any) => {
        if (!res) {
          this.router.navigate(["user/info"], { replaceUrl: true })
          return subs.next(false);
        }


        this.service.restaurant = res.restaurant;

        return subs.next(true);
      });
    });

    return this.sequentialRoutingGuardService.queue(route, observable);
  }

}
