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

        const token = localStorage.getItem("token");


        if(token) {
            try {
                const result = await this.main.auth().toPromise();

                if (result.authorized) {
                    if (result.redirectTo) {
                        this.router.navigate([result.redirectTo], { replaceUrl: true });
                        return false;
                    }
                    this.router.navigate(["user/info"], { replaceUrl: true });
                    return false;
                } else {
                    this.main.removeUserInfo();
                    return true;
                }
            } catch (error) {
                if(error.status == 401) {
                    this.main.removeUserInfo();
                    return true;
                }
            }
        } else {
            return true;
        }

        try {
            const result = await this.main.auth().toPromise();

            if (result.success) {
                if (result.redirectTo) {
                    this.router.navigate([result.redirectTo], { replaceUrl: true });
                    return false;
                }
                this.router.navigate(["user/info"], { replaceUrl: true });
                return false;
            } else {
                return true;
            }
        } catch (e) {
            if (e.status == 401) {
                return true;
            }
            throw e;
        }
    }
}
