import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { UserService } from '../../user.service';

@Component({
    selector: 'app-code',
    templateUrl: './code.component.html',
    styleUrls: ['./code.component.scss'],
})
export class CodeComponent implements OnInit {

    code: string;
    token: string;

    ui = {
        message: "",
    }

    constructor(
        private service: UserService,
        private router: RouterService,
        private route: ActivatedRoute,
        private loader: LoadService,
    ) { };


    onCodeCompleted(code: string) {
        this.code = code;
    }


    async verify() {
        if(!this.code) {
            this.ui.message = "Please, enter the code";
            return;
        }

        try {
            await this.loader.start();
            
            const result: { success: string; } = await this.service.post({ code: this.code, token: this.token }, "reset/confirm-code");

            if(result.success) {
                this.router.go(["user/forgot-password/password"], { queryParamsHandling: "preserve" });
            } else {
                this.router.go(["user/forgot-password/email"]);
            }
        } catch (e) {
            if(e.status == 403) {
                if(e.body.reason == "IncorrectCode") {
                    this.ui.message = "The code is incorrect. Please try again";
                    this.loader.end();
                    return;
                }
            }
            this.router.go(["user/forgot-password/email"]);
        }
    }


    async ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get("token");
        if (!this.token) {
            this.router.go(["user/forgot-password/email"]);
            return;
        }

        try {
            const result: { success: boolean; } = await this.service.post({ token: this.token }, "reset/check");
        } catch (e) {
            this.router.go(["user/forgot-password/email"]);
        }
    }
}
