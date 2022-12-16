import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FullDishGuard } from './dishes/full-dish/full-dish.guard';

import { MenuPage } from './menu.page';

const routes: Routes = [
  {
    path: '',
    component: MenuPage,
    children: [
        {
            path: "",
            pathMatch: "full",
            redirectTo: "dishes",
        },
        {
            path: "dishes",
            loadChildren: () => import("./dishes/dishes-list/dishes-list.module").then(m => m.DishesListModule),
        },
        {
            path: 'dish/:dishId',
            loadChildren: () => import('./dishes/full-dish/full-dish.module').then(m => m.FullDishPageModule),
            canActivate: [FullDishGuard],
        },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MenuPageRoutingModule {}
