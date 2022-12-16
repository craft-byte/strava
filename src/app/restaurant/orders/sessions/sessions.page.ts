import { Component, OnInit } from '@angular/core';
import { RestaurantService } from '../../restaurant.service';

@Component({
    selector: 'app-sessions',
    templateUrl: './sessions.page.html',
    styleUrls: ['./sessions.page.scss'],
})
export class SessionsPage implements OnInit {

    sessions: any;

    constructor(
        private service: RestaurantService,
    ) { }

    async ngOnInit() {
        const result = await this.service.get({}, "sessions");


        this.sessions = result;

        console.log(result);
    }

}
