import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/other/main.service';
import { UserService } from '../../user.service';

@Component({
    selector: 'app-password-modal',
    templateUrl: './password-modal.component.html',
    styleUrls: ['./password-modal.component.scss'],
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    animations: [
        trigger("showUp", [
            transition(":enter", [
                group([
                    style({ backgroundColor: "rgba(0,0,0,0)" }),
                    animate("200ms ease-in", style({ backgroundColor: "rgba(0,0,0,0.25)" })),
                    query(".box", [
                        style({ opacity: "0", scale: "0.8" }),
                        animate("200ms ease-in", style({ opacity: "1", scale: "1" })),
                    ])
                ])
            ]),
            transition(":leave", [
                group([
                    animate("200ms ease-in", style({ backgroundColor: "rgba(0,0,0,0)" })),
                    query(".box", [
                        style({ opacity: "1", scale: "1" }),
                        animate("200ms ease-in", style({ opacity: "0", scale: "0.8" })),
                    ])
                ])
            ]),
        ])
    ]
})
export class PasswordModalComponent implements OnInit {

    form: FormGroup;

    ui = {
        currentMessage: "",
        newMessage: ""
    }

    constructor(
        private service: UserService,
        private toastCtrl: ToastController,
        private router: RouterService,
        private main: MainService,
    ) { };


    @Output() leave = new EventEmitter();

    reset() {
        this.router.go(["user/forgot-password/email"], { queryParams: { email: this.main.user.email } });
    }

    async submit() {
        const { currentPassword, newPassword, confirmPassword } = this.form.value;

        if(currentPassword == newPassword) {
            this.ui.newMessage = "Current password is the same as new";
            return;
        }
        if(currentPassword.length < 8) {
            this.ui.currentMessage = "Password cannot be less than 8 characters";
            return;
        }
        if(newPassword != confirmPassword) {
            this.ui.newMessage = "Passwords are not the same";
            return;
        }

        try {
            const result: { success: boolean; } = await this.service.post(this.form.value, "profile/password");

            if(result.success) {
                this.leave.emit();
                (await this.toastCtrl.create({
                    duration: 1000,
                    message: "Password has been successfuly changed.",
                    color: "green",
                    mode: "ios",
                })).present();
            } else {
                (await this.toastCtrl.create({
                    duration: 1000,
                    message: "Something went wrong. Please try again.",
                    color: "green",
                    mode: "ios",
                })).present();
            }
        } catch (e) {
            if(e.status == 422) {
                if(e.body.reason == "CurrentPasswordInvalid") {
                    this.ui.currentMessage = "Password is invalid";
                } else if(e.body.reason == "NewPasswordInvalid") {
                    this.ui.newMessage = "New password is invalid";
                } else {
                    (await this.toastCtrl.create({
                        duration: 1000,
                        message: "Your data is invalid.",
                        color: "red",
                        mode: "ios",
                    })).present();
                }
            } else if(e.status == 403) {
                if(e.body.reason == "PasswordIncorrect") {
                    this.ui.currentMessage = "Password is incorrect";
                }
            }
        }
    }


    ngOnInit() {
        this.form = new FormGroup({
            currentPassword: new FormControl(null, Validators.required),
            newPassword: new FormControl(null, Validators.required),
            confirmPassword: new FormControl(null, Validators.required),
        });
    }

}
