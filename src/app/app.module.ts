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
import { Interceptor } from './other/interceptor';
import { NgxStripeModule } from 'ngx-stripe';
import { RouteReuseStrategy } from '@angular/router';

const disableAnimations = () => {

    if (
        !('animate' in document.documentElement)
        || (navigator && /iPhone OS (8|9|10|11|12|13)_/.test(navigator.userAgent))
    ) {
        return true;
    }

    if(window.innerWidth < 1200) {
        return true;
    }

    return false;
}


@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule.withConfig({ disableAnimations: disableAnimations(), }),
        SocketIoModule.forRoot({ url: environment.socketLink, options: {} }),
        IonicModule.forRoot({ animated: !disableAnimations() }),
        NgxStripeModule.forRoot("pk_test_51KNlK6LbfOFI72xW4xnsuE6JQRte49N0HFiLw9mfQn8JF1JuImLOr2QJZewBZwXiPRNgsS6ebeiOisn3Gebp0zLT00i143bkrp"),
        AppRoutingModule,
        HttpClientModule,
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        { provide: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
