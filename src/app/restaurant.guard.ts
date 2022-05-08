import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { MainService } from './services/main.service';

@Injectable({
  providedIn: 'root'
})
export class RestaurantGuard implements CanActivate {
  constructor(
    private service: MainService
  ) {};


  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    

    const restaurantId = route.params.restaurantId;

    // const result = await this.service.allowed(state.url, restaurantId);

    // console.log(result);

    return true;
  }
  
}
