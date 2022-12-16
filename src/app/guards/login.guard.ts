import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Subscriber } from 'rxjs';
import { RouterService } from '../other/router.service';
import { MainService } from '../other/main.service';

@Injectable({
    providedIn: 'root'
})
export class LoginGuard implements CanActivate {

    constructor(
        private main: MainService,
        private router: RouterService,
    ) {

    }


    /**
     * 
     *
     * LOGGIN GUARD checks token for validity and if it is NOT valid passes
     * opposite to LOGGED GUARD which checks if token IS valid
     *  
     * 
     */
    async canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {

        const token = localStorage.getItem("token");
        const exp = localStorage.getItem("exp");

        if(!token || !exp) {
            this.removeAuthData()
            return true;
        }

        const expires = Number(exp);
        
        if(isNaN(expires) || expires < Date.now()) {
            this.removeAuthData()
            return true;
        }

        this.onUserLoggedIn(route.queryParamMap.get("last"));

        return false;
    }

    onUserLoggedIn(last: string) {
        if(last) {
            this.router.go([last]);
        } else {
            this.router.go(["user/info"]);
        }
    }
    
    removeAuthData() {
        // remove invalid token and token expire
        localStorage.removeItem("token");
        localStorage.removeItem("exp");
    }
}
