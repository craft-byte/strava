import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EmailSetupPage } from './email-setup.page';

const routes: Routes = [
  {
    path: '',
    component: EmailSetupPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmailSetupPageRoutingModule {}
