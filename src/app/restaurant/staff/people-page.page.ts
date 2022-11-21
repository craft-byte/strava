import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-people-page',
  templateUrl: './people-page.page.html',
  styleUrls: ['./people-page.page.scss'],
})
export class PeoplePagePage implements OnInit {

  routerSubs: Subscription;
  page: string = "staff";

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  go(page: string) {
    this.page = page;
    this.router.navigate([page], { relativeTo: this.route, replaceUrl: true })
  }
  
  ngOnInit() {
    this.page = this.router.url.split("/")[4];
    if(this.page == "worker" || this.page == "full") {
      this.page = "staff";
    }
    this.routerSubs = this.router.events.subscribe(a => {
      if(a instanceof NavigationEnd) {
        this.page = a.url.split("/")[4];
        if(this.page == "worker" || this.page == "full") {
          this.page = "staff";
        }
      }
    });
  }
  ngOnDestroy() {
    this.routerSubs.unsubscribe();
  }
}
