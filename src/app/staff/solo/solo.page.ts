import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app/other/router.service';
import { StaffService } from '../staff.service';
import { SoloService } from './solo.service';

@Component({
    selector: 'app-solo',
    templateUrl: './solo.page.html',
    styleUrls: ['./solo.page.scss'],
})
export class SoloPage implements OnInit {

    constructor(
        private router: RouterService,
        private service: StaffService,
        private soc: SoloService,
    ) { }

    close() {
        this.router.go(["restaurant", this.service.restaurantId]);
    }

    async ngOnInit() {

    }

}
