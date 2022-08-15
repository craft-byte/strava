import { Component } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterEvent } from '@angular/router';
import { LoadService } from './other/load.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    // private router: Router,
    // private loader: LoadService,
  ) {
    // this.router.events.subscribe(async (e: RouterEvent) => {
    //   if (e instanceof NavigationStart) {
    //     await this.loader.start();
    //   }

    //   if(e instanceof NavigationEnd) {
    //     this.loader.end();
    //   }
  
    //   if (e instanceof NavigationCancel) {
    //     this.loader.end();
    //   }
    //   if (e instanceof NavigationError) {
    //     this.loader.end();
    //   }
    // })
  }
}
