import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DishCookingPage } from './dish-cooking.page';

const routes: Routes = [
  {
    path: '',
    component: DishCookingPage
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DishCookingPageRoutingModule {}
