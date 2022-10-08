import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PasswordResetPageRoutingModule } from './password-reset-routing.module';

import { PasswordResetPage } from './password-reset.page';
import { CodeComponent } from './code/code.component';
import { PasswordComponent } from './password/password.component';
import { CodeInputModule } from 'angular-code-input';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PasswordResetPageRoutingModule,
        CodeInputModule
    ],
    declarations: [
        PasswordResetPage,
        CodeComponent,
        PasswordComponent,
    ]
})
export class PasswordResetPageModule { }
