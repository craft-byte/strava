import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { User, UserStatus } from '../other/models/user';

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule],
})
export class AccountComponent implements OnInit {

    constructor() { };

    @Input() user: User;
    @Input() userStatus: UserStatus;

    @Output() leave = new EventEmitter();

    close() {
        this.leave.emit();
    }

    goAccount() {
        this.leave.emit("account");
    }

    signOut() {
        this.leave.emit("signout");
    }

    signUp() {
        this.leave.emit("signup");
    }

    login() {
        this.leave.emit("login");
    }

    ngOnInit() { }

}
