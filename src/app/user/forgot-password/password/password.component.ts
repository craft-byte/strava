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

    token: string;

    password: string;
    confirm: string;

    ui = {
        message: "",
    }

    constructor(
        private router: RouterService,
        private service: UserService,
        private route: ActivatedRoute,
        private loader: LoadService,
        private toastCtrl: ToastController,
    ) { };

    async reset() {
        if(!this.password || !this.confirm) {
            this.ui.message = "Please, enter password above";
            return;
        } else if(this.password.length < 8) {
            this.ui.message = "Password can't be less than 8 characters";
            return;
        } else if(this.password != this.confirm) {
            this.ui.message = "Passwords are not the same";
            return;
        }
        this.ui.message = "";

        try {
            await this.loader.start();

            const result: { success: boolean; } = await this.service.post({ password: this.password, token: this.token }, "reset/password");

            if(result.success) {
                this.router.go(["login"]);
                (await this.toastCtrl.create({
                    duration: 1500,
                    color: "green",
                    mode: "ios",
                    message: "Password successfuly changed",
                })).present();
                return;
            } else {
                (await this.toastCtrl.create({
                    duration: 1500,
                    color: "green",
                    mode: "ios",
                    message: "Something went wrong. Please try again",
                })).present();
            }
        } catch (e) {
            if(e.status == 422 && e.body.reason == "InvalidPassword") {
                this.ui.message = "Password can't be less than 8 characters";
                this.loader.end();
                return;
            } else {
                this.router.go(["user/forgot-password/email"]);
            }
        }
    }

    async ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get("token");

        if(!this.token) {
            return this.router.go(["user/forgot-password/email"], { queryParams: { token: null } });
        }

        this.loader.end();
    }

}
