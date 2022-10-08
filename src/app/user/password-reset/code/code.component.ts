import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { UserService } from '../../user.service';

@Component({
    selector: 'app-code',
    templateUrl: './code.component.html',
    styleUrls: ['./code.component.scss'],
})
export class CodeComponent implements OnInit {

    ui = {
        message: ""
    };

    code: string;

    constructor(
        private router: RouterService,
        private loader: LoadService,
        private service: UserService,
        private toastCtrl: ToastController,
    ) { }

    back() {
        this.router.go(["user/settings"]);
    }

    onCodeCompleted(code: string) {
        if(isNaN(Number(code))) {
            this.ui.message = "Code is invalid. Code can contain only numbers";
            return;
        }
        this.code = code;
    }

    async resend() {
        try {
            const result = await this.service.post({ force: true, }, "code/resend");

            if(!result) {
                this.back();
            }
        } catch (e) {
            this.back();
        }
    }

    async submit() {
        await this.loader.start();

        try {
            const result: { success: boolean; token: string; } = await this.service.post({ code: this.code }, "password/confirm-code")    

            if(result.success) {
                this.router.go(["user", "reset-password", "password"], { queryParams: { token: result.token }, queryParamsHandling: "merge" });
            } else {
                (await this.toastCtrl.create({
                    duration: 1500,
                    message: "Something went wrong. Please try again",
                    color: "red",
                    mode: "ios",
                })).present();
            }
        } catch (error) {
            this.back();
        }
    }

    async ngOnInit() {
        await this.loader.start();

        try {
            const result = await this.service.post({ force: false, }, "code/resend");

            if(!result) {
                this.back();
            }
        } catch (e) {
            this.back();
        }

        this.loader.end();
    }

}
