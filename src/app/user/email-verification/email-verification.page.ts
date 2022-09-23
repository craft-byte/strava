import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { UserService } from '../user.service';

@Component({
    selector: 'app-email-verification',
    templateUrl: './email-verification.page.html',
    styleUrls: ['./email-verification.page.scss'],
})
export class EmailVerificationPage implements OnInit {

    email: string = "abdas";
    code: string;

    interval: any;
    countdown: number;

    ui = {
        disableSubmit: false,
        message: ""
    }

    constructor(
        private router: RouterService,
        private service: UserService,
        private loader: LoadService,
        private toastCtrl: ToastController,
    ) { };

    /**
     * when code-input is completed
     * @param {stirng} code 
     */
    onCodeCompleted(code: string) {
        this.code = code;
    }

    /**
     * sends POST /email/resend
     * creates countdown 60 seconds
     */
    async resend() {
        this.countdown = 60;
        this.interval = setInterval(() => {
            this.countdown--;
            if (this.countdown == 0) {
                clearInterval(this.interval);
            }
        }, 1000);

        const result = await this.service.post<{ success: boolean; }>({}, "email/resend");

        if (result.success) {
            (await this.toastCtrl.create({
                duration: 1000,
                color: "green",
                message: "Code has been sent again",
                mode: "ios",
            })).present();
        } else {
            (await this.toastCtrl.create({
                duration: 1000,
                color: "green",
                message: "Something went wrong. Please try again",
                mode: "ios",
            })).present();
        }
    }

    /**
     * 
     * when Verify button clicked
     * sends POST /email/confirm
     * with { code: this.code }
     * 
     * redirects to user/info is success
     * ui.message if not
     * 
     */
    async verify() {
        this.ui.disableSubmit = true;

        console.log(this.code);

        if (!this.code) {
            this.ui.disableSubmit = false;
            this.ui.message = "Enter code here.";
            return;
        }

        await this.loader.start();

        try {
            const result: { success: boolean; } = await this.service.post({ code: this.code }, "email/confirm");

            if(result.success) {
                this.router.go(['user/info']);
                (await this.toastCtrl.create({
                    duration: 1000,
                    color: "green",
                    message: "Email confirmed!",
                    mode: "ios",
                })).present();
            }
        } catch (e) {
            if(e.status == 422) {
                if(e.body.reason == "CodeInvalid") {
                    this.code = null;
                    this.ui.message = "Code is invalid";
                    this.ui.disableSubmit = false;
                }
            } else if(e.status == 403) {
                if(e.body.reason == "CodeIncorrect") {
                    this.code = null;
                    this.ui.message = "Code is incorrect";
                    this.ui.disableSubmit = false;
                } else if(e.body.reason == "EmailConfirmed") {
                    this.router.go(["user/info"]);
                    (await this.toastCtrl.create({
                        duration: 3000,
                        message: "Email has been confirmed. If you want to change email go to settings.",
                        color: "warning",
                        mode: "ios",
                    })).present();
                    return;
                } else if(e.body.reason == "CodeNotSet") {
                    this.router.go(["user/info"]);
                    (await this.toastCtrl.create({
                        duration: 1500,
                        message: "Something went wrong. Please try again.",
                        color: "red",
                        mode: "ios",
                    })).present();
                    return;
                }
            }
        }


        this.loader.end();
    }

    async ngOnInit() {
        await this.loader.start();


        try {
            const result = await this.service.get<{ email: string; }>("email/check");
            this.email = result.email
        } catch (e) {
            if(e.status == 403) {
                if(e.body.reason == "AccountConfirmed") {
                    this.router.go(["user/info"]);
                    (await this.toastCtrl.create({
                        duration: 3000,
                        message: "Email has been confirmed. If you want to change email go to settings.",
                        color: "warning",
                        mode: "ios",
                    })).present();
                    return;
                }
            }
        }




        this.loader.end();
    }

}
