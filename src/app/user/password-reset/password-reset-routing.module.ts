import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CodeComponent } from './code/code.component';

import { PasswordResetPage } from './password-reset.page';
import { PasswordComponent } from './password/password.component';

const routes: Routes = [
    {
        path: '',
        component: PasswordResetPage,
        children: [
            {
                path: "",
                pathMatch: "full",
                redirectTo: "code",
            },
            {
                path: "code",
                component: CodeComponent,
            },
            {
                path: "password",
                component: PasswordComponent,
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PasswordResetPageRoutingModule { }
