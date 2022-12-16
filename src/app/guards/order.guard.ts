import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { CustomerService } from '../customer/customer.service';

@Injectable({
    providedIn: 'root'
})
export class OrderGuard implements CanActivate {

    constructor(
        private service: CustomerService,
    ) { };


    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

        const restaurantId = route.paramMap.get("restaurantId");


        // ObjectId is 24 chars length
        if(restaurantId && restaurantId.length == 24) {

            this.service.restaurantId = restaurantId;

            return true;
        }
        
        return false;
    }
}