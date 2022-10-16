import { animate, group, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { getImage } from 'src/functions';

@Component({
    selector: 'app-user-popover',
    templateUrl: './user-popover.component.html',
    styleUrls: ['./user-popover.component.scss'],
    standalone: true,
    imports: [CommonModule],
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
export class UserPopoverComponent implements OnInit {

    avatar: string;

    constructor() { };

    @Input() user: any;
    @Output() leave = new EventEmitter();
    @ViewChild("popover") component: ElementRef;

    signout() {
        this.leave.emit("signout");
    }
    account() {
        this.leave.emit("account");
    }
    login() {
        this.leave.emit("login");
    }
    signup() {
        this.leave.emit("signup");
    }

    ngOnInit() {
        if(this.user) {
            this.avatar = getImage(this.user.avatar);
        }
    }

}
