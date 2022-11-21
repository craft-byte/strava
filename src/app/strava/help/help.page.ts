import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

@Component({
    selector: 'app-help',
    templateUrl: './help.page.html',
    styleUrls: ['./help.page.scss'],
})
export class HelpPage implements OnInit {

    current: string;
    restaurantId: string;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {
        this.router.events.subscribe(e => {
            if(e instanceof NavigationEnd) {
                this.current = e.url.split("/")[e.url.split("/").length - 1].split("?")[0];
            }
        })
    }

    ngOnInit() {
        this.restaurantId = this.route.snapshot.queryParamMap.get("r");
    }

}
