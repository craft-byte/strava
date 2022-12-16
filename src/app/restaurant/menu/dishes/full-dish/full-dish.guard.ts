import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Dish } from 'src/models/dish';
import { RestaurantService } from '../../../restaurant.service';

@Injectable({
  providedIn: 'root'
})
export class FullDishGuard implements CanActivate {

  constructor(
    private router: Router,
    private service: RestaurantService,
  ) {}
  
  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {

    const id = route.paramMap.get("dishId");

    if(id.length != 24) {
      console.log("FULLDISHGUARD: NO ID");
      return this.router.navigate(["restaurant", this.service.restaurant._id, "dishes", "list"], { replaceUrl: true });
    }

    return true;
  }
  
}
