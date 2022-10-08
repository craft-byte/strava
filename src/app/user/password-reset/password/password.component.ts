import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { UserService } from '../../user.service';

@Component({
    selector: 'app-password',
    templateUrl: './password.component.html',
    styleUrls: ['./password.component.scss'],
})
export class PasswordComponent implements OnInit {

    ui = {
        message: "",
    };

    password: string;
    confirm: string;

    constructor(
        private router: RouterService,
        private loader: LoadService,
        private service: UserService,
        private route: ActivatedRoute,
        private toastCtrl: ToastController,
    ) { };


    async submit() {
        if(this.password != this.confirm) {
            return this.ui.message = "Passwords are not the same";
        } else if(this.password.length < 8) {
            return this.ui.message = "Password has to be more than 8 characters";
        }

        try {
            await this.loader.start();

            const token = this.route.snapshot.queryParamMap.get("token");

            const result: { updated: boolean; } = await this.service.post({ password: this.password, token }, "password", "reset"); 

            if(result.updated) {
                this.router.go(["user", "settings"]);
                return;
            } else {
                (await this.toastCtrl.create({
                    duration: 2000,
                    color: "red",
                    mode: "ios",
                    message: "Something went wrong. Try again.",
                })).present();
            }
        } catch (e) {
            if(e.status == 422) {
                if(e.body.reason == "InvalidPassword") {
                    this.ui.message = "Password is invalid";
                }
            } else if(e.status == 403) {
                if(e.body.reason == "InvalidToken" || e.body.reason == "SessionExpired") {
                    (await this.toastCtrl.create({
                        duration: 2000,
                        message: "Please, confirm your email",
                        mode: "ios",
                        color: "red",
                    })).present();
                    this.router.go(["user", "reset-password", "code"], { queryParams: { token: null }, queryParamsHandling: "merge" });
                    return;
                }
            }
        }

        this.loader.end();
    }

    exit() {
        this.router.go(["user/settings"]);
    }

    async ngOnInit() {
        const token = this.route.snapshot.queryParamMap.get("token");
        if(!token) {
            (await this.toastCtrl.create({
                duration: 2000,
                message: "Please, confirm your email",
                mode: "ios",
                color: "red",
            })).present();
            this.router.go(["user", "reset-password", "code"], { queryParams: { token: null }, queryParamsHandling: "merge" });
            return;
        }

        this.loader.end();
    }

}
