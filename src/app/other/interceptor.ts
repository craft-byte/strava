import { Location } from "@angular/common";
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ToastController } from "@ionic/angular";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { RouterService } from "./router.service";

@Injectable()
export class Interceptor implements HttpInterceptor {

    constructor(
        private router: RouterService,
        private routerAngular: Router,
        private location: Location,
        private toastCtrl: ToastController,
    ) { };

    async toast() {
        (await this.toastCtrl.create({
            duration: 1500,
            color: "red",
            message: "You're not supposed to be there.",
            mode: "ios",
        })).present();
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        request = request.clone({
            withCredentials: true,
        });
        return next.handle(request).pipe(
            catchError(err => {
                if(err instanceof HttpErrorResponse) {
                    if(err.status == 401) {
                        this.router.go(["login"], { replaceUrl: true, queryParams: { last: this.router.url } }, false);
                    } else if(err.status == 403) {
                        if(err.error.redirect) {
                            this.toast();
                            if(this.routerAngular.navigated) {
                                this.location.back();
                            } else {
                                this.router.go(["user/info"]);
                            }
                        }
                    }
                    console.log(err.error);
                    return throwError({ status: err.status, body: err.error });
                }
            })
        );
    }
}
