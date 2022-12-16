import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DishEditPage } from './dish-edit.page';

const routes: Routes = [
  {
    path: '',
    component: DishEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DishEditPageRoutingModule {}
