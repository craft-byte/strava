import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DobPage } from './dob.page';

const routes: Routes = [
  {
    path: '',
    component: DobPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DobPageRoutingModule {}
