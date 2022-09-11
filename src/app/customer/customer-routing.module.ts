import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomerPage } from './customer.page';

const routes: Routes = [
  {
    path: '',
    component: CustomerPage,
    children: [
      {
        path: "",
        pathMatch: "full",
        redirectTo: "scan",
      },
      {
        path: "map",
        loadChildren: () => import("./map/map.module").then(m => m.MapPageModule),
      },
      {
        path: 'scan',
        loadChildren: () => import('./scan/scan.module').then( m => m.ScanPageModule)
      },
      {
        path: 'history',
        loadChildren: () => import('./history/history.module').then( m => m.HistoryPageModule)
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomerPageRoutingModule {}
