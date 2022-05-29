import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SetUpPage } from './set-up.page';

const routes: Routes = [
  {
    path: '',
    component: SetUpPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SetUpPageRoutingModule {}
