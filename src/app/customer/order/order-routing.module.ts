import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrderPage } from './order.page';

const routes: Routes = [
  {
    path: '',
    component: OrderPage,
    children: [
        {
            path: "",
            redirectTo: "home",
            pathMatch: "full",
        },
        {
            path: "home",
            loadChildren: () => import("./dishes/recommendations/recommendations.module").then(m => m.RecommendationsPageModule),
        }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderPageRoutingModule {}
