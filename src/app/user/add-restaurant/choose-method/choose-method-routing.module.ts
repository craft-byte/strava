import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ChooseMethodPage } from './choose-method.page';

const routes: Routes = [
  {
    path: '',
    component: ChooseMethodPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChooseMethodPageRoutingModule {}
