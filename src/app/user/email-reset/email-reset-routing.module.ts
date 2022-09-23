import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EmailResetPage } from './email-reset.page';

const routes: Routes = [
  {
    path: '',
    component: EmailResetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmailResetPageRoutingModule {}
