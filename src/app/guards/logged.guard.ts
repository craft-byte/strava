import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { HttpErrorResponse } from "@angular/common/http";
import { RouterService } from '../other/router.service';
import { SequentialRoutingGuardService } from '../other/sequential-routing-guard.service';
import { MainService } from '../services/main.service';
import { catchError } from "rxjs/operators";

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

    canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

        const observalbe = new Observable<boolean>(subs => {
            this.main.auth().pipe(
                catchError(err => {
                    if(err instanceof HttpErrorResponse) {
                        if(err.status == 401) {
                            return of({ success: false });
                        }
                    }
                    return throwError(err);
                })
            ).subscribe(result => {
                if (result.authorized) {
                    this.main.userInfo = result.user as any;
                    return subs.next(true);
                } else {
                    this.main.removeUserInfo();
                    this.router.go(["login"], { replaceUrl: true, queryParams: { last: state.url } });
                    return subs.next(false);
                }
            });
        });

        return this.sequentialRoutingGuardService.queue(
            _route,
            observalbe
        );
    }

}
