import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CodeComponent } from './code/code.component';
import { EmailComponent } from './email/email.component';

import { ForgotPasswordPage } from './forgot-password.page';
import { PasswordComponent } from './password/password.component';

const routes: Routes = [
  {
    path: '',
    component: ForgotPasswordPage,
    children: [
        {
            path: "",
            pathMatch: "full",
            redirectTo: "email"
        },
        {
            path: "email",
            component: EmailComponent,
        },
        {
            path: "code",
            component: CodeComponent,
        },
        {
            path: "password",
            component: PasswordComponent
        }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ForgotPasswordPageRoutingModule {}
