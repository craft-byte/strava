import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ForgotPasswordPageRoutingModule } from './forgot-password-routing.module';

import { ForgotPasswordPage } from './forgot-password.page';
import { CodeComponent } from './code/code.component';
import { PasswordComponent } from './password/password.component';
import { EmailComponent } from './email/email.component';
import { CodeInputModule } from 'angular-code-input';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ForgotPasswordPageRoutingModule,
    CodeInputModule
  ],
  declarations: [ForgotPasswordPage, CodeComponent, PasswordComponent, EmailComponent]
})
export class ForgotPasswordPageModule {}
