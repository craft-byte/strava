import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// import { RouteReuseStrategy } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SocketIoModule } from 'ngx-socket-io';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { HashLocationStrategy } from '@angular/common';

// { navAnimation: (baseEl: HTMLElement, opts?: any) => {
      
//   console.log(baseEl);
  
//   const animationCtrl = new AnimationController();

//   if(opts.direction === "forward") {
//     return animationCtrl.create()
//       .addElement(opts.enteringEl)
//       .duration(500)
//       .easing("ease-in")
//       .fromTo("opacity", 0, 1);
//   } else {
//     return null;
//   }
// } }

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SocketIoModule.forRoot({ url: environment.socketLink, options: {} }),
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [{ provide: HashLocationStrategy, useClass: IonicRouteStrategy }, CookieService],
  bootstrap: [AppComponent],
})
export class AppModule {}
