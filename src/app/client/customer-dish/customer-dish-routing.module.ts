import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomerDishPage } from './customer-dish.page';

const routes: Routes = [
  {
    path: '',
    component: CustomerDishPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomerDishPageRoutingModule {}
