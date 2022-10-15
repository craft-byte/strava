import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/services/main.service';
import { UserService } from '../../user.service';

@Component({
    selector: 'app-email',
    templateUrl: './email.component.html',
    styleUrls: ['./email.component.scss'],
})
export class EmailComponent implements OnInit {

    email: string;

    ui = {
        message: "",
        showBackButton: false,
    }

    constructor(
        private service: UserService,
        private router: RouterService,
        private route: ActivatedRoute,
        private loader: LoadService,
        private main: MainService,
    ) { };

    back() {
        if(localStorage.getItem("token")) {
            this.router.go(["user/settings"]);
        } else {
            this.router.go(["login"]);
        }
    }


    async send() {
        console.log(this.email);
        const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

        if(!format.test(this.email)) {
            this.ui.message = "Email address is invalid";
            return;
        }
        this.ui.message = "";


        try {
            await this.loader.start();

            const result: { success: boolean; token: string; } = await this.service.post({ email: this.email }, "reset/send-code");

            if(result.success) {
                this.router.go(["user/forgot-password/code"], { queryParams: { token: result.token, email: null } });
                return;
            } else {
                this.ui.message = "Something went wrong. Please try again";
            }
        } catch (e) {
            if(e.status == 403) {
                if(e.body.reason == "UnknownEmailAddress") {
                    this.ui.message = "The email address is not connected to any account";
                }
            }
        }

        this.loader.end();
    }

    async ngOnInit() {
        const email = this.route.snapshot.queryParamMap.get("email");
        if(email) {
            this.email = email;
        }
        this.ui.showBackButton = !!localStorage.getItem("token");
        this.loader.end();
    }

}
