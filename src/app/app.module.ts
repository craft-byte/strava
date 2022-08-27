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

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SocketIoModule.forRoot({ url: environment.socketLink, options: {  } }),
        IonicModule.forRoot(),
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
