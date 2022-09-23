import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/services/main.service';
import { UserService } from '../../user.service';

@Component({
    selector: 'app-remove-modal',
    templateUrl: './remove-modal.component.html',
    styleUrls: ['./remove-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule],
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
export class RemoveModalComponent implements OnInit {

    password: string;

    ui = {
        disableSubmit: false,
        passwordMessage: ""
    }

    constructor(
        private router: RouterService,
        private loader: LoadService,
        private service: UserService,
        private main: MainService,
        private toastCtrl: ToastController,
    ) { }

    @Output() leave = new EventEmitter();


    async submit() {
        if(!this.password || this.password.length < 8) {
            this.ui.passwordMessage = "Password can't be less than 8 characters";
            return;
        }
        this.ui.passwordMessage = "";

        
        try {
            await this.loader.start();

            const result: { success: boolean; } = await this.service.post({ password: this.password }, "/remove");

            if(result.success) {
                this.main.removeUserInfo();
                this.router.go([""]);
                return;
            } else {
                (await this.toastCtrl.create({
                    duration: 1500,
                    message: "Something went wrong. Please try again",
                    mode: "ios",
                    color: "red",
                })).present();
            }
        } catch (e) {
            if(e.status == 403) {
                if(e.body.reason == "PasswordIncorrect") {
                    this.ui.passwordMessage = "Password is incorrect";
                }
            } else if(e.status == 422) {
                this.ui.passwordMessage = "Password is invalid";
            }
        }

        this.loader.end();
    }

    ngOnInit() { }

}
