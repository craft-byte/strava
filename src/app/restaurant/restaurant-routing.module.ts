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
        path: 'staff',
        loadChildren: () => import('./people-page/staff/staff.module').then( m => m.StaffModule)
      },
      {
        path: 'orders',
        loadChildren: () => import('./people-page/orders/orders.module').then( m => m.OrdersPageModule)
      },
      {
        path: 'customers',
        loadChildren: () => import('./people-page/customers/customers.module').then( m => m.CustomersPageModule)
      },
    //   {
    //     path: 'people',
    //     loadChildren: () => import('./people-page/people-page.module').then( m => m.PeoplePagePageModule)
    //   },
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
  {
    path: 'dish-add',
    loadChildren: () => import('./dish-add/dish-add.module').then( m => m.DishAddPageModule)
  },
  {
    path: 'dish-edit',
    loadChildren: () => import('./dish-edit/dish-edit.module').then( m => m.DishEditPageModule)
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RestaurantPageRoutingModule {}
