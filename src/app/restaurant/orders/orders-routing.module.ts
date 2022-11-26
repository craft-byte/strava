import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrdersPage } from './orders.page';

const routes: Routes = [
    {
        path: '',
        component: OrdersPage,
        children: [
            {
                path: "",
                pathMatch: "full",
                redirectTo: "list",
            },
            {
                path: 'list',
                loadChildren: () => import('./list/list.module').then(m => m.ListPageModule)
            },
            {
                path: "customers",
                loadChildren: () => import("./customers/customers.module").then(m => m.CustomersPageModule),
            },
            {
                path: "full/:orderId",
                loadChildren: () => import("./full-order/full-order.module").then(m => m.FullOrderPageModule),
            },
            {
                path: "customer/:userId",
                loadChildren: () => import("./customer/customer.module").then(m => m.CustomerPageModule),
            },
        ]
    },

];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class OrdersPageRoutingModule { }
