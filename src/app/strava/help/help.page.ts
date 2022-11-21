import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from "rxjs";

@Component({
    selector: 'app-help',
    templateUrl: './help.page.html',
    styleUrls: ['./help.page.scss'],
})
export class HelpPage implements OnInit, OnDestroy {

    current: string;
    restaurantId: string;

    subscription: Subscription;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {
        this.subscription = this.router.events.subscribe(e => {
            if(e instanceof NavigationEnd) {
                this.current = e.url.split("/")[e.url.split("/").length - 1].split("?")[0];
            }
        })
    }

    ngOnInit() {
        this.restaurantId = this.route.snapshot.queryParamMap.get("r");

        this.router.navigate([], { queryParamsHandling: "merge"})
    }
    ngOnDestroy(): void {
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
