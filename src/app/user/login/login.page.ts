import { Component, OnInit, ViewChild } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { ActivatedRoute } from '@angular/router';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { ToastController } from '@ionic/angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

    @ViewChild("passwordElement") passwordInput: any;

    ui = {
        usernameMessage: "",
        passwordMessage: "",
        disableSubmit: false,
    }

    form: FormGroup;

    constructor(
        private main: MainService,
        private router: RouterService,
        private route: ActivatedRoute,
        private loader: LoadService,
        private toastCtrl: ToastController,
    ) {

    };


    checkUsername() {
        const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

        if (format.test(this.form.value.username)) {
            this.ui.usernameMessage = "";
            return true;
        }
        
        this.ui.usernameMessage = "Username is invalid";
        return false;
    }
    checkPassword() {
        if (this.form.value.password.length < 8) {
            this.ui.passwordMessage = "Password can't be less than 8 characters";
            return;
        }
        
        this.ui.passwordMessage = "";
        return true;
    }

    onEnter() {
        if (!this.checkUsername()) {
            return;
        }

        this.ui.usernameMessage = "";

        this.passwordInput.nativeElement.focus();
    }

    //
    //  the main function
    //
    async login() {
        this.ui.disableSubmit = true;
        if (!this.form.valid) {
            this.ui.disableSubmit = false;
            return;
        }


        await this.loader.start();


        try {
            const { username, password } = this.form.value;
            const result: { success: boolean; redirectTo: string; } = await this.main.login({ email: username, password: password });



            if (result.success) {
                const last = this.route.snapshot.queryParamMap.get("last");

                if (last) {
                    this.router.go([last], { replaceUrl: true });
                } else if (result.redirectTo) {
                    this.router.go([result.redirectTo], { replaceUrl: true });
                } else {
                    this.router.go(["user/info"]);
                }
            } else {
                this.ui.passwordMessage = "Please, check your data again";
                this.ui.disableSubmit = false;
                this.loader.end();
            }
        } catch (e) {
            if(e.status == 422) {
                (await this.toastCtrl.create({
                    duration: 2000,
                    message: "Your data is invalid",
                    color: "red",
                    mode: "ios",
                })).present();
            } else if(e.status == 401 || e.status == 404) {
                this.router.go(["registration/email"]);
                (await this.toastCtrl.create({
                    duration: 2000,
                    message: "Your data is incorrect",
                    color: "red",
                    mode: "ios",
                })).present();
                this.ui.passwordMessage = "Incorrect data";
            }
            this.ui.disableSubmit = false;
            this.loader.end();
        }
    }



    signUp() {
        this.router.go(["registration"], { replaceUrl: true });
    }
    forgot() {
        this.router.go(["reset"], { replaceUrl: true });
    }

    async ngOnInit() {
        this.form = new FormGroup({
            username: new FormControl(null, [Validators.required, Validators.email]),
            password: new FormControl(null, [Validators.required, Validators.minLength(8)]),
        });
        this.loader.end();
    }
}
