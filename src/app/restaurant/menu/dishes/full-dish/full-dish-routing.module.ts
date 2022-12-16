import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FullDishGuard } from './full-dish.guard';

import { FullDishPage } from './full-dish.page';

const routes: Routes = [
  {
    path: "",
    component: FullDishPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FullDishPageRoutingModule {}
