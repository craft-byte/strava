import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Observable, } from 'rxjs';
import { RouterService } from '../other/router.service';
import { SequentialRoutingGuardService } from '../other/sequential-routing-guard.service';
import { MainService } from '../other/main.service';

@Injectable({
    providedIn: 'root'
})
export class LoggedGuard implements CanActivate {

    constructor(
        private main: MainService,
        private router: RouterService,
        private sequentialRoutingGuardService: SequentialRoutingGuardService,
    ) {

    }


    /**
     * 
     * 
     * LOGGED GUARD checks the auth token validity
     * 
     * 
     */

    canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

        const observalbe = new Observable<boolean>(subs => {

            const token = localStorage.getItem("token");
            const exp = localStorage.getItem("exp");

            if(!token || !exp) {
                this.goLogin()
                return subs.next(false);
            }

            // expires as number of milliseconds (Date.now() + 12 hours)
            const expires = Number(exp);

            if(isNaN(expires) || expires < Date.now()) {
                this.goLogin()
                return subs.next(false);
            }

            // if token expires in less than an hour issue new without logging in
            if(expires - 3600000 < Date.now()) {
                // update token
                this.main.updateToken().then(() => {
                    subs.next(true);
                });
                return;
            }
            // gets this.main.user data
            // main.updateToken retreives user data too, so calling main.getUserData() is not needed.
            else if(!this.main.user) {
                this.main.getUserData().then(() => {
                    subs.next(true);
                });
                return;
            }

            subs.next(true);
        });

        return this.sequentialRoutingGuardService.queue(
            _route,
            observalbe
        );
    }

    goLogin() {
        // remove invalid token and token expire
        this.main.removeUserInfo();

        this.router.go(["user/login"]);
    }
}
