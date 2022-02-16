import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginGuard } from './login.guard';
import { RidGuard } from './rid.guard';
import { DishGuard } from './restaurant/dish.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import("./ctraba/main/main.module").then(m => m.MainPageModule)
  },
  {
    path: 'radmin',
    loadChildren: () => import('./restaurant/radmin/radmin.module').then( m => m.RadminPageModule),
    canActivate: [LoginGuard, RidGuard]
  },
  {
    path: 'user-create',
    loadChildren: () => import('./user/user-create/user-create.module').then( m => m.UserCreatePageModule)
  },
  {
    path: 'user-info',
    loadChildren: () => import('./user/user-info/user-info.module').then( m => m.UserInfoPageModule)
  },
  {
    path: "login",
    loadChildren: () => import("./user/login/login.module").then(m => m.LoginPageModule)
  },
  {
    path: 'customer',
    loadChildren: () => import('./client/customer/customer.module').then( m => m.CustomerPageModule)
  },
  {
    path: 'dish-more/:id',
    loadChildren: () => import('./client/customer-dish/customer-dish.module').then( m => m.CustomerDishPageModule)
  },
  {
    path: 'payment',
    loadChildren: () => import('./client/payment/payment.module').then( m => m.PaymentPageModule)
  },
  {
    path: 'user/:id',
    loadChildren: () => import('./user/user/user.module').then( m => m.UserPageModule)
  },
  {
    path: 'user-settings',
    loadChildren: () => import('./user/settings/settings.module').then( m => m.SettingsPageModule)
  },
  {
    path: 'danger/:type',
    loadChildren: () => import('./user/danger/danger.module').then( m => m.DangerPageModule)
  },
  {
    path: "staff-login",
    loadChildren: () => import("./staff/staff-login/staff-login.module").then(m => m.StaffLoginPageModule)
  },
  {
    path: "waiter",
    loadChildren: () => import("./staff/waiter/waiter.module").then(m => m.WaiterPageModule)
  },
  {
    path: "kitchen",
    loadChildren: () => import("./staff/kitchen/kitchen.module").then(m => m.KitchenPageModule)
  },
  {
    path: 'worker/:restaurant/:id',
    loadChildren: () => import('./staff/worker/worker.module').then(m => m.WorkerPageModule)
  },
  {
    path: 'add-restaurant',
    loadChildren: () => import('./user/add-restaurant/add-restaurant.module').then( m => m.AddRestaurantPageModule)
  },
  {
    path: 'help',
    loadChildren: () => import('./user/help/help.module').then( m => m.HelpPageModule)
  },
  {
    path: 'confirm',
    loadChildren: () => import('./user/confirm/confirm.module').then( m => m.ConfirmPageModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./ctraba/admin/admin.module').then( m => m.AdminPageModule)
  },
  {
    path: 'blog',
    loadChildren: () => import('./ctraba/blog/blog.module').then( m => m.BlogPageModule)
  },
  {
    path: "dish/:mode",
    loadChildren: () => import("./restaurant/dish/dish.module").then(m => m.DishPageModule),
    canActivate: [DishGuard, RidGuard, LoginGuard]
  },
  {
    path: "**",
    redirectTo: "user-info"
  }
];
  
@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    BrowserAnimationsModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
