import { animate, query, state, style, transition, trigger } from '@angular/animations';
import { NONE_TYPE } from '@angular/compiler';
import { Component, OnInit, Input } from '@angular/core';
import { RouterService } from 'src/app/other/router.service';

@Component({
    selector: 'app-restaurant',
    templateUrl: './restaurant.component.html',
    styleUrls: ['./restaurant.component.scss'],
    animations: [
        trigger("slideDown", [
            transition(":enter", [
                style({ height: 0, opacity: 0, }),
                animate("200ms", style({ opacity: 1, height: "*" })),
            ]),
            transition(":leave", [
                animate("200ms", style({ height: 0, opacity: 0, })),
            ]),
        ])
    ]
})
export class RestaurantComponent implements OnInit {

    showMore = false;
    name: string;

    constructor(
        private router: RouterService,
    ) { };

    @Input() restaurant: any;

    select() {
        this.router.go(["customer", "order", this.restaurant._id]);
    }

    more() {
        this.showMore = !this.showMore;
    }

    ngOnInit() {
        if(this.restaurant.name.length > 12) {
            this.name = this.restaurant.name.slice(0, 12) + "...";
        } else {
            this.name = this.restaurant.name;
        }
    }

}
