import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

@Injectable()
export class Interceptor implements HttpInterceptor {

    constructor(private router: Router) {

    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        request = request.clone({
            withCredentials: true
        });
        return next.handle(request).pipe(
            catchError(err => {
                if(err instanceof HttpErrorResponse) {
                    console.error(err.status);
                    if(err.status == 401) {
                        this.router.navigate(["login"], { replaceUrl: true, queryParams: { last: this.router.url } });
                    }
                    return throwError(err.status);
                }
            })
        );
    }
}
