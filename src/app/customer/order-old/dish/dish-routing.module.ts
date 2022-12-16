import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DishPage } from './dish.page';

const routes: Routes = [
  {
    path: '',
    component: DishPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DishPageRoutingModule {}
