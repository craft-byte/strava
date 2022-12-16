import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DishAddPage } from './dish-add.page';

const routes: Routes = [
  {
    path: '',
    component: DishAddPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DishAddPageRoutingModule {}
