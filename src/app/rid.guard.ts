import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { MainService } from './main.service';

@Injectable({
  providedIn: 'root'
})
export class RidGuard implements CanActivate {

  constructor(
    private main: MainService,
    private router: Router
  ) {

  }

  async canActivate(
    route: ActivatedRouteSnapshot
  ): Promise<boolean | UrlTree> {
    const restaurant = route.queryParamMap.get("restaurant");
    if(!restaurant || restaurant.length !== 24) {
      if((this.main.userInfo && this.main.userInfo.restaurants.length > 0) || !await this.main.login(true)) {
        return this.router.navigate(['radmin'], { queryParams: { restaurant: this.main.userInfo.restaurants[0] } })
      } else {
        return this.router.navigate(["user-info"]);
      }
    } else if(this.main.userInfo && !this.main.isOwner(restaurant)) {
      return this.router.navigate(["user-info"]);
    } else {
      return true;
    }
  }
  
}
