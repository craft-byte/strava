import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { SequentialRoutingGuardService } from '../other/sequential-routing-guard.service';
import { MainService } from '../services/main.service';

@Injectable({
  providedIn: 'root'
})
export class EmailGuard implements CanActivate {

  constructor(
    private main: MainService,
    private router: Router,
    private sequentialRoutingGuardService: SequentialRoutingGuardService,
  ) {}


  canActivate(route: ActivatedRouteSnapshot, state: any) {
    console.log("EMAIL GUARD");
    const observalbe = new Observable<boolean>(subs => {
      if(this.main.userInfo) {
        if(this.main.userInfo.email) {
          this.router.navigate(["user/info"], { replaceUrl: true });
          subs.next(false);
        } else {
          subs.next(true);
        }
      } else {
        console.error("NO MAIN USERINFO!!!!!");
      }
    });

    return this.sequentialRoutingGuardService.queue(
      route,
      observalbe
    );
  }

}
