import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SequentialRoutingGuardService } from './other/sequential-routing-guard.service';
import { MainService } from './services/main.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(
    private main: MainService,
    private router: Router,
    private sequentialRoutingGuardService: SequentialRoutingGuardService,
  ) {

  }

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    console.log("LOGIN GUARD");

    const observalbe = new Observable<boolean>(subs => {
      if (this.main.userInfo) {
        this.main.auth("false").subscribe(result => {
          if (result) {
            return subs.next(true);
          }
          this.router.navigate(["login"], { replaceUrl: true, queryParams: { last: state.url } });
          return subs.next(false);
        })
      } else {
        this.main.auth("true").subscribe(result => {
          if (result) {
            this.main.userInfo = result as any;
            return subs.next(true);
          } else {
            this.router.navigate(["login"], { replaceUrl: true, queryParams: { last: state.url } });
            return subs.next(false);
          }
        });
      }
    });

    return this.sequentialRoutingGuardService.queue(
      _route,
      observalbe
    );

    // if(this.main.userInfo){
    //   const result = await this.main.auth("false");
    //   if(result) {
    //     return true;
    //   }
    //   this.router.navigate(["login"], { replaceUrl: true, queryParams: { last: state.url } });
    //   return false;
    // } else {
    //   const result = await this.main.auth("true");
    //   if(result) {
    //     this.main.userInfo = result as any;
    //     return true;
    //   } else {
    //     this.router.navigate(["login"], { replaceUrl: true, queryParams: { last: state.url } });
    //     return false;
    //   }
    // }
  }

}
