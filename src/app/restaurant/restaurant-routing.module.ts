import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FullDishGuard } from './menu/dishes/full-dish/full-dish.guard';

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
                loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
            },
            {
                path: "dishes/:dishId",
                loadChildren: () => import("./menu/dishes/full-dish/full-dish.module").then(m => m.FullDishPageModule),
            },
            {
                path: 'staff',
                loadChildren: () => import('./staff/staff/staff.module').then(m => m.StaffModule)
            },
            {
                path: 'orders',
                loadChildren: () => import('./orders/orders.module').then(m => m.OrdersPageModule)
            },
            {
                path: 'customers',
                loadChildren: () => import('./orders/customers/customers.module').then(m => m.CustomersPageModule)
            },
            {
                path: 'settings',
                loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule)
            },
            {
                path: 'qr-codes',
                loadChildren: () => import('./qr-codes/qr-codes.module').then(m => m.QrCodesPageModule)
            },
            {
                path: "menu",
                loadChildren: () => import("./menu/menu.module").then(m => m.MenuPageModule),
            },
        ]
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class RestaurantPageRoutingModule { }
