import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginGuard } from './login.guard';
import { DishGuard } from './restaurant/dish.guard';
import { RestaurantGuard } from './restaurant.guard';



const user: Routes = [
  {
    path: 'user-create',
    loadChildren: () => import('./user/user-create/user-create.module').then( m => m.UserCreatePageModule)
  },
  {
    path: 'user/info',
    loadChildren: () => import('./user/user-info/user-info.module').then( m => m.UserInfoPageModule),
    canActivate: [LoginGuard],
    runGuardsAndResolvers: "always",
  },
  {
    path: "login",
    loadChildren: () => import("./user/login/login.module").then(m => m.LoginPageModule)
  },
  {
    path: 'user/settings',
    loadChildren: () => import('./user/settings/settings.module').then( m => m.SettingsPageModule),
    canActivate: [LoginGuard],
  },
  {
    path: 'add-restaurant',
    loadChildren: () => import('./user/add-restaurant/add-restaurant.module').then( m => m.AddRestaurantPageModule),
    canActivate: [LoginGuard]
  },
  {
    path: 'email-setup',
    loadChildren: () => import('./user/email-setup/email-setup.module').then( m => m.EmailSetupPageModule),
    canActivate: [LoginGuard]
  },
];
const restaurant: Routes = [
  {
    path: "dish/:restaurantId/:mode",
    loadChildren: () => import("./restaurant/dish/dish.module").then(m => m.DishPageModule),
    canActivate: [LoginGuard, RestaurantGuard, DishGuard]
  },
  {
    path: 'dish-cooking/:restaurantId/:dish',
    loadChildren: () => import('./restaurant/dish-cooking/dish-cooking.module').then( m => m.DishCookingPageModule)
    , canActivate: [LoginGuard, RestaurantGuard]
  },
  {
    path: 'invite-user/:restaurantId',
    loadChildren: () => import('./restaurant/invite-user/invite-user.module').then( m => m.InviteUserPageModule),
    canActivate: [LoginGuard, RestaurantGuard]
  },
  {
    path: 'invite-user/:restaurantId/:user',
    loadChildren: () => import('./restaurant/worker-set-up/worker-set-up.module').then( m => m.WorkerSetUpPageModule),
    canActivate: [LoginGuard, RestaurantGuard]
  },
  {
    path: 'restaurant',
    loadChildren: () => import('./restaurant/radmin/radmin.module').then( m => m.RadminPageModule),
    canActivate: [LoginGuard],
    runGuardsAndResolvers: "always"
  },
];
const staff: Routes = [
  {
    path: "staff/:restaurantId/dashboard",
    loadChildren: () => import("./staff/dashboard/dashboard.module").then(m => m.DashboardPageModule),
    canActivate: [LoginGuard]
  },
  {
    path: "staff/:restaurantId/kitchen",
    loadChildren: () => import("./staff/kitchen/kitchen/kitchen.module").then(m => m.KitchenPageModule)
    , canActivate: [LoginGuard]
  },
  {
    path: "staff/:restaurantId/waiter",
    loadChildren: () => import("./staff/waiter/waiter/waiter.module").then(m => m.WaiterPageModule),
    canActivate: [LoginGuard]
  }
];


const routes: Routes = [
  {
    path: '',
    loadChildren: () => import("./ctraba/main/main.module").then(m => m.MainPageModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./ctraba/admin/admin.module').then( m => m.AdminPageModule)
  },
  {
    path: 'blog',
    loadChildren: () => import('./ctraba/blog/blog.module').then( m => m.BlogPageModule)
  },
  ...staff,
  ...user,
  ...restaurant,
  {
    path: "**",
    redirectTo: "user"
  },
  {
    path: 'jobs',
    loadChildren: () => import('./user/jobs/jobs.module').then( m => m.JobsPageModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./staff/dashboard/dashboard.module').then( m => m.DashboardPageModule)
  },
];
  
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' }),
    BrowserAnimationsModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
