import { Injectable } from '@angular/core';
import { NavigationEnd, NavigationExtras, Router, RouterEvent } from '@angular/router';
import { LoadService } from './load.service';

@Injectable({
  providedIn: 'root'
})
export class RouterService {
  url: string;

  constructor(
    public r: Router,
    private loader: LoadService,
  ) {
    // this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    // this.router.onSameUrlNavigation = "reload";
    this.r.events.subscribe((e: RouterEvent) => {
      if(e instanceof NavigationEnd) {
        this.url = e.url;
      }
    });
  };


  async go(path: string[], options: NavigationExtras = {}, showLoader: boolean = true) {
    this.r.navigate(path, { ...options, replaceUrl: false, });
  }
}
