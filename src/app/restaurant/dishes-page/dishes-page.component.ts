import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dishes-page',
  templateUrl: './dishes-page.component.html',
  styleUrls: ['./dishes-page.component.scss'],
})
export class DishesPageComponent implements OnInit, OnDestroy {

  routerSubs: Subscription;
  page: string = "list";

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  go(page: string) {
    this.page = page;
    this.router.navigate([page], { relativeTo: this.route, replaceUrl: true })
  }
  
  ngOnInit() {
    this.page = this.router.url.split("/")[4];
    this.routerSubs = this.router.events.subscribe(a => {
      if(a instanceof NavigationEnd) {
        this.page = a.url.split("/")[4];
      }
    });
  }
  ngOnDestroy() {
    this.routerSubs.unsubscribe();
  }
}
