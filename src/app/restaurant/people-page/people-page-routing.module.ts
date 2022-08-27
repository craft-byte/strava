import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PeoplePagePage } from './people-page.page';

const routes: Routes = [
  {
    path: '',
    component: PeoplePagePage,
    children: [
      {
        path: "",
        pathMatch: "full",
        redirectTo: "staff"
      },
      {
        path: "staff",
        loadChildren: () => import("./staff/staff.module").then(m => m.StaffModule)
      },
      {
        path: "worker/invite",
        loadChildren: () => import("./worker/invite/invite.module").then(m => m.InvitePageModule)
      },
      {
        path: "worker/:userId/set-up",
        loadChildren: () => import("./worker/set-up/set-up.module").then(m => m.SetUpPageModule)
      },
      {
        path: "orders",
        loadChildren: () => import("./orders/orders.module").then(m => m.OrdersPageModule)
      },
      {
        path: 'customers',
        loadChildren: () => import('./customers/customers.module').then( m => m.CustomersPageModule)
      },
      {
        path: 'order/:orderId',
        loadChildren: () => import('./full-order/full-order.module').then( m => m.FullOrderPageModule)
      },
      {
        path: 'worker/:userId',
        loadChildren: () => import('./worker/full/full.module').then( m => m.FullPageModule)
      },
      {
        path: 'worker/:userId/settings',
        loadChildren: () => import('./worker/settings/settings.module').then( m => m.SettingsPageModule)
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PeoplePagePageRoutingModule {}
