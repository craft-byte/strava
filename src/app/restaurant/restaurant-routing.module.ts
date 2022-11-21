import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FullDishGuard } from './dishes/full-dish/full-dish.guard';

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
        loadChildren: () => import("./dishes/dishes-list/dishes-list.module").then(m => m.DishesListModule),
      },
      {
        path: "dishes/:dishId",
        loadChildren: () => import("./dishes/full-dish/full-dish.module").then(m => m.FullDishPageModule),
      },
      {
        path: 'staff',
        loadChildren: () => import('./staff/staff/staff.module').then( m => m.StaffModule)
      },
      {
        path: 'orders',
        loadChildren: () => import('./orders/orders/orders.module').then( m => m.OrdersPageModule)
      },
      {
        path: 'customers',
        loadChildren: () => import('./customers/customers/customers.module').then( m => m.CustomersPageModule)
      },
    //   {
    //     path: 'people',
    //     loadChildren: () => import('./people-page/people-page.module').then( m => m.PeoplePagePageModule)
    //   },
      {
        path: 'dishes/full/:dishId',
        loadChildren: () => import('./dishes/full-dish/full-dish.module').then( m => m.FullDishPageModule),
        canActivate: [FullDishGuard],
      },
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.module').then( m => m.SettingsPageModule)
      },
      {
        path: "orders/:orderId",
        loadChildren: () => import("./orders/full-order/full-order.module").then(m => m.FullOrderPageModule),
      }
    ]
  },
//   {
//     path: 'dish-add',
//     loadChildren: () => import('./dish-add/dish-add.module').then( m => m.DishAddPageModule)
//   },
//   {
//     path: 'dish-edit',
//     loadChildren: () => import('./dish-edit/dish-edit.module').then( m => m.DishEditPageModule)
//   },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RestaurantPageRoutingModule {}
