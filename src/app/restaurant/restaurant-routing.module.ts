import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FullDishGuard } from './dishes-page/full-dish/full-dish.guard';

import { RestaurantPage } from './restaurant.page';

const routes: Routes = [
  {
    path: '',
    component: RestaurantPage,
    children: [
      {
        path: "",
        pathMatch: "full",
        redirectTo: "home",
      },
      {
        path: 'home',
        loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
      },
      {
        path: "dishes",
        loadChildren: () => import("./dishes-page/dishes-page.module").then(m => m.DishesPageModule)
      },
      {
        path: 'people',
        loadChildren: () => import('./people-page/people-page.module').then( m => m.PeoplePagePageModule)
      },
      {
        path: 'dishes/full/:dishId',
        loadChildren: () => import('./dishes-page/full-dish/full-dish.module').then( m => m.FullDishPageModule),
        canActivate: [FullDishGuard],
      },
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.module').then( m => m.SettingsPageModule)
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RestaurantPageRoutingModule {}
