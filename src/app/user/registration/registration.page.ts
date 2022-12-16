import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/other/main.service';
import { UserService } from '../user.service';

@Component({
    selector: 'app-registration',
    templateUrl: './registration.page.html',
    styleUrls: ['./registration.page.scss'],
})
export class RegistrationPage implements OnInit {

    ui = {
        emailMessage: "",
        nameMessage: "",
        passwordMessage: "",
        disableSubmit: false,
    };

    form: FormGroup;

    constructor(
        private router: RouterService,
        private loader: LoadService,
        private service: UserService,
        private main: MainService,
        private toastCtrl: ToastController,
    ) { };

    checkPassword() {
        const { password } = this.form.value;

        if(password.length < 8) {
            this.ui.passwordMessage = "Password must be more than 8 characters";
            return;
        }

        this.ui.passwordMessage = "";
    }
    checkEmail() {
        const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
        const { email } = this.form.value;

        if(email.length == 0) {
            return;
        }

        if(!format.test(email)) {
            this.ui.emailMessage = "Email address is invalid";
            return;
        }

        this.ui.emailMessage = "";
    }


    /**
     * 
     * called when submit button clicked
     * makes request to /create
     * 
     */
    async submit() {
        if(!this.form.valid) {
            return;
        }
        await this.loader.start();
        this.ui.disableSubmit = true;

        try {
            const result: { success: boolean; auth: { token: string; expires: number; } } = await this.service.post({ ...this.form.value }, "create");

            if(!result.success) {
                (await this.toastCtrl.create({
                    duration: 2000,
                    color: "red",
                    message: "Something went wrong, please try again",
                    mode: "ios",
                })).present();
                this.loader.end();
                this.ui.disableSubmit = true;
                return;
            } else {
                this.main.setUserInfo(result.auth.token, result.auth.expires);
                this.router.go(["user/info"]);
                return;
            }
        } catch (e) {
            if(e.status == 422) {
                this.checkEmail();
                this.checkPassword();
                this.loader.end();
                this.ui.disableSubmit = false;
                return;
            } else if(e.status == 403) {
                if(e.body.reason == "EmailRegistered") {
                    this.loader.end();
                    this.ui.emailMessage = "This email is already registered.";
                    this.ui.disableSubmit = false;
                    return;
                }
            }
            this.router.go(["login"]);
        }
    }


    async ngOnInit() {
        this.form = new FormGroup({
            firstName: new FormControl(null, Validators.required),
            lastName: new FormControl(null, Validators.required),
            password: new FormControl(null, Validators.required),
            email: new FormControl(null, Validators.required)
        });
        this.loader.end();
    }
}
