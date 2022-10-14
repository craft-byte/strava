import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { UserService } from '../user.service';

@Component({
    selector: 'app-email-reset',
    templateUrl: './email-reset.page.html',
    styleUrls: ['./email-reset.page.scss'],
})
export class EmailResetPage implements OnInit {

    ui = {
        disableSubmit: false,
        passwordMessage: "",
        emailMessage: "",
    };


    form: FormGroup;

    constructor(
        private service: UserService,
        private router: RouterService,
        private loader: LoadService,
        private toastCtrl: ToastController,
    ) { };

    resetPassword() {
        this.router.go(["user/password-reset"]);
    }
    contact() {
        
    }

    back() {
        this.router.go(["user/settings"]);
    }

    async submit() {
        const { password, email } = this.form.value;

        if(!password || password.length < 8) {
            this.ui.passwordMessage = "Password can't be less than 8 characters";
            return;
        }
        this.ui.passwordMessage = "";
        if(!email || !this.form.valid) {
            this.ui.emailMessage = "Email address is invalid";
            return;
        }

        
        try {
            const result: { success: boolean; } = await this.service.post({ password, email }, "email/reset");

            if(result.success) {
                (await this.toastCtrl.create({
                    duration: 1000,
                    color: "green",
                    mode: "ios",
                    message: "Email changed successfuly. Now confirm"
                })).present();
                this.router.go(["user/email/verification"]);
                return;
            } else {
                (await this.toastCtrl.create({
                    duration: 2000,
                    color: "red",
                    mode: "ios",
                    message: "Something went wrong. Please try again"
                })).present();
            }
        } catch (e) {
            if(e.status == 422) {
                if(e.body.reason == "PasswordInvalid") {
                    this.ui.passwordMessage = "Password is invalid";
                } else if(e.body.reason == "EmailInvalid") {
                    this.ui.emailMessage = "Email address is invalid";
                } else {
                    (await this.toastCtrl.create({
                        duration: 2000,
                        color: "red",
                        mode: "ios",
                        message: "Data is invalid."
                    })).present();
                }
            } else if(e.status == 403) {
                if(e.body.reason == "PasswordIncorrect") {
                    this.ui.passwordMessage = "Password is incorrect";
                } else if(e.body.reason == "EmailTaken") {
                    this.ui.emailMessage = "Email address is taken";
                } else if(e.body.reason == "SameEmails") {
                    this.ui.emailMessage = "Choose different email address";
                }
            }
        }

        this.loader.end();
    }

    async ngOnInit() {

        this.form = new FormGroup({
            password: new FormControl(null, Validators.required),
            email: new FormControl(null, [Validators.required, Validators.email]),
        })

        this.loader.end();

    }

}
