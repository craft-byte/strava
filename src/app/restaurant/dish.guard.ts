import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DishGuard implements CanActivate {

  constructor(
    private router: Router
  ) {

  }

  canActivate(
    route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
      const mode = route.paramMap.get("mode");
      const id = route.queryParamMap.get("dish");

      if((mode !== "add" && mode !== "edit") || (mode == "edit" && !id)) {
        return this.router.navigate(["radmin", "dishes", "overview"], { queryParamsHandling: "preserve" });
      }


      return true;

  }
  
}
