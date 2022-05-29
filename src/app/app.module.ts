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
import { DragAndDropDirective } from './directives/drag-and-drop.directive';
import { AuthInterceptor } from './other/auth-interceptor';


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
