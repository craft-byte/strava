import { Component, OnInit } from '@angular/core';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';

@Component({
    selector: 'app-password-reset',
    templateUrl: './password-reset.page.html',
    styleUrls: ['./password-reset.page.scss'],
})
export class PasswordResetPage implements OnInit {

    ui = {

    };

    constructor(
        private router: RouterService,
        private loader: LoadService,
    ) { };

    async ngOnInit() {

    }

}
