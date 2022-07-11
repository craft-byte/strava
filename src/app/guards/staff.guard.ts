import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, observable } from 'rxjs';
import { SequentialRoutingGuardService } from '../other/sequential-routing-guard.service';
import { StaffService } from '../staff/staff.service';

@Injectable({
  providedIn: 'root'
})
export class StaffGuard implements CanActivate {
  constructor(
    private router: Router,
    private serice: StaffService,
    private sequentialRoutingGuardService: SequentialRoutingGuardService,
  ) {};
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    const observalbe = new Observable<boolean>(subs => {
      const { restaurantId } = route.params;
  
      if(!restaurantId || restaurantId.lenght < 24) {
        this.router.navigate(["user/info"], { replaceUrl: true });
        return subs.next(false);
      }
  
      this.serice.init(restaurantId);
  
      return subs.next(true);
    });


    return this.sequentialRoutingGuardService.queue(
      route,
      observalbe
    );
  }
  
}
