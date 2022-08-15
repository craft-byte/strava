import { HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { RouterService } from "./router.service";

@Injectable()
export class Interceptor implements HttpInterceptor {

    constructor(private router: RouterService) {

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
                    }
                    console.log(err.error);
                    return throwError({ status: err.status, body: err.error });
                }
            })
        );
    }
}
