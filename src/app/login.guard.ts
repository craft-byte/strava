import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { stat } from 'fs';
import { MainService } from './services/main.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(
    private main: MainService,
    private router: Router
  ) {

  }

  async canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if(this.main.userInfo){
      const result = await this.main.auth("false");
      if(result) {
        return true;
      }
      this.router.navigate(["login"], { replaceUrl: true, queryParams: { last: state.url } });
      return false;
    } else {
      const result = await this.main.auth("true");
      if(result) {
        this.main.userInfo = result as any;
        return true;
      } else {
        this.router.navigate(["login"], { replaceUrl: true, queryParams: { last: state.url } });
        return false;
      }
    }
  }
  
}
