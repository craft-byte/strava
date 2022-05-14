import { Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// import { RouteReuseStrategy } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SocketIoModule } from 'ngx-socket-io';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HTTP_INTERCEPTORS } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { HashLocationStrategy, Location } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { DragAndDropDirective } from './directives/drag-and-drop.directive';
import { retry, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';


@Injectable()
class AuthInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private location: Location
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      withCredentials: true
    });
    return next.handle(request).pipe(
      catchError((data: HttpErrorResponse) => {
        switch (data.status) {
          case 401:
            this.router.navigate(["login"], { replaceUrl: true, queryParamsHandling: "preserve" });
            break;
        
          case 403:
            if(this.router.navigated) {
              this.location.back();
            } else {
              this.router.navigate(["user/info"], { replaceUrl: true, queryParamsHandling: "preserve" });
            }
            break;
          // case 422: 
            // this.router.navigate(["user/info"], { replaceUrl: true, queryParamsHandling: "preserve" });
        }
        return throwError(data.statusText);
      })
    );
  }
}

@NgModule({
    declarations: [AppComponent, DragAndDropDirective],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SocketIoModule.forRoot({ url: environment.socketLink, options: {} }),
        IonicModule.forRoot(),
        AppRoutingModule,
        HttpClientModule
    ],
    providers: [
        { provide: HashLocationStrategy, useClass: IonicRouteStrategy },
        CookieService,
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
