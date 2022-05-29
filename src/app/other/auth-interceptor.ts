import { Location } from "@angular/common";
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ToastController } from "@ionic/angular";
import { Observable } from "rxjs";
import { catchError } from "rxjs/operators";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private location: Location,
    private toastCtrl: ToastController,
  ) { };

  async presentToast() {
    (await this.toastCtrl.create({
      duration: 3000,
      color: "red",
      message: "You are not allowed to do this.",
      mode: "ios"
    })).present();
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      withCredentials: true
    });
    return next.handle(request)
    .pipe(
      catchError((data: HttpErrorResponse) => {
        switch (data.status) {
          case 401:
            console.error(401);
            this.router.navigate(["login"], { replaceUrl: true, queryParamsHandling: "merge", queryParams: { last: this.router.url } });
            break;
        
          case 403:
            console.error(403);
            if(this.router.navigated) {
              this.location.back();
            } else {
              this.router.navigate(["user/info"], { replaceUrl: true, queryParamsHandling: "preserve" });
            }
            break;
          case 405:
            console.error(405);
            this.presentToast();
        }
        return new Observable<never>();
      })
    );
  }
}