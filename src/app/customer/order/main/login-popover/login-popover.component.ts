import { animate, group, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadService } from 'src/app/other/load.service';
import { MainService } from 'src/app/services/main.service';

@Component({
    selector: 'app-login-popover',
    templateUrl: './login-popover.component.html',
    styleUrls: ['./login-popover.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule],
    animations: [
        trigger("showUp", [
            transition(":enter", [
                group([
                    style({ backgroundColor: "rgba(0, 0, 0, 0)", "padding-top": "100vh" }),
                    animate("300ms ease-in", style({ backgroundColor: "rgba(0, 0, 0, 0.3)", "padding-top": "128px" })),
                    // animate("300ms ease-out", style({  })),
                ])
            ]),
        ])
    ]
})
export class LoginPopoverComponent implements OnInit {

    ui = {
        emailMessage: "",
        passwordMessage: "",
    };

    username: string;
    password: string;

    constructor(
        private main: MainService,
        private loader: LoadService,
    ) { }

    @Output() leave = new EventEmitter();

    async login() {
        const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
        if(!this.username || !format.test(this.username)) {
            this.ui.emailMessage = "Invalid email address";
            return;
        }
        this.ui.emailMessage = "";
        if(!this.password || this.password.length < 8) {
            this.ui.passwordMessage = "Invalid password";
            return;
        }
        this.ui.passwordMessage = "";
        await this.loader.start();


        try {
            const result = await this.main.login({ email: this.username, password: this.password });

            if(result.success) {
                this.leave.emit(true);
            } else {
                this.ui.passwordMessage = "Your data is incorrect";
                this.loader.end();
            }
        } catch (e) {
            if(e.status == 401 || e.status == 404) {
                this.ui.passwordMessage = "Your data is incorrect";
            } else if(e.status == 422) {
                this.ui.passwordMessage = "Provided data is invalid";
            }
            this.loader.end()
        }
    }


    ngOnInit() {

    }

}
