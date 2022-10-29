import { Injectable } from '@angular/core';
import { NavigationBehaviorOptions, NavigationEnd, NavigationExtras, Router, RouterEvent } from '@angular/router';
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
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = "reload";
    this.router.events.subscribe((e: RouterEvent) => {
      if(e instanceof NavigationEnd) {
        this.url = e.url;
      }
    });
  };


  async go(path: string[], options: NavigationExtras = {}, showLoader: boolean = true) {
    this.router.navigate(path, { ...options });
  }
}
