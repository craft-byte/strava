import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CookieService } from 'ngx-cookie-service';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SocketIoModule } from 'ngx-socket-io';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { HashLocationStrategy } from '@angular/common';
import { Interceptor } from './other/interceptor';
import { NgxStripeModule } from 'ngx-stripe';

const disableAnimations =
  !('animate' in document.documentElement)
  || (navigator && /iPhone OS (8|9|10|11|12|13)_/.test(navigator.userAgent));


@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule.withConfig({ disableAnimations }),
        SocketIoModule.forRoot({ url: environment.socketLink, options: {  } }),
        IonicModule.forRoot(),
        NgxStripeModule.forRoot("pk_test_51KNlK6LbfOFI72xW4xnsuE6JQRte49N0HFiLw9mfQn8JF1JuImLOr2QJZewBZwXiPRNgsS6ebeiOisn3Gebp0zLT00i143bkrp"),
        AppRoutingModule,
        HttpClientModule,
    ],
    providers: [
        { provide: HashLocationStrategy, useClass: IonicRouteStrategy },
        CookieService,
        { provide: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
