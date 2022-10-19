import { Injectable } from '@angular/core';
import { NavigationEnd, NavigationExtras, Router, RouterEvent } from '@angular/router';
import { LoadService } from './load.service';

@Injectable({
  providedIn: 'root'
})
export class RouterService {
  url: string;

  constructor(
    private router: Router,
    private loader: LoadService,
  ) {
    this.router.events.subscribe((e: RouterEvent) => {
      if(e instanceof NavigationEnd) {
        this.url = e.url;
      }
    });
  };


  async go(path: string[], options: NavigationExtras = {}, showLoader: boolean = true) {
    if(showLoader === true) {
      await this.loader.start();
    }
    this.router.navigate(path, { replaceUrl: true, ...options});
  }
}
