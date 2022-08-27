import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FullOrderPage } from './full-order.page';

const routes: Routes = [
  {
    path: '',
    component: FullOrderPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FullOrderPageRoutingModule {}
