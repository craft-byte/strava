import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { MainService } from '../services/main.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(
    private main: MainService,
    private router: Router,
  ) {

  }

  async canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {

    console.log("LOGIN GUARD NOT LOGGED");

    if (this.main.userInfo) {
      const result = await this.main.auth("false").toPromise();
      if (result) {
        this.router.navigate(["user/info"], { replaceUrl: true });
        return false;
      }
      return true;
    } else {
      const result = await this.main.auth("true").toPromise();
      if (result) {
        this.main.userInfo = result as any;
        this.router.navigate(["user/info"], { replaceUrl: true });
        return false;
      } else {
        return true;
      }
    }
  }
}
