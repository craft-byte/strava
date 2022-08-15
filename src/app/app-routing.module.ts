import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoggedGuard } from './guards/logged.guard';
import { RestaurantGuard } from './guards/restaurant.guard';
import { LoginGuard } from './guards/login.guard';
import { loadavg } from 'os';
import { StaffGuard } from './guards/staff.guard';



const user: Routes = [
  {
    path: 'user/info',
    loadChildren: () => import('./user/user-info/user-info.module').then( m => m.UserInfoPageModule),
    canActivate: [LoggedGuard],
    runGuardsAndResolvers: "always",
  },
  {
    path: "user/name/:type",
    loadChildren: () => import("./user/registration/name/name.module").then(m => m.NamePageModule),
    canActivate: [LoggedGuard],
  },
  {
    path: 'user/email',
    loadChildren: () => import('./user/registration/email-setup/email-setup.module').then( m => m.EmailSetupPageModule),
    canActivate: [LoggedGuard]
  },
  {
    path: "user/avatar/:type",
    loadChildren: () => import("./user/registration/avatar/avatar.module").then(m => m.AvatarPageModule),
    canActivate: [LoggedGuard],
  },
  {
    path: 'user/settings',
    loadChildren: () => import('./user/settings/settings.module').then( m => m.SettingsPageModule),
    canActivate: [LoggedGuard],
  },
  {
    path: "user/account",
    loadChildren: () => import("./user/account/account.module").then( m => m.AccountPageModule),
    canActivate: [LoggedGuard],
  },
  {
    path: "login",
    loadChildren: () => import("./user/login/login.module").then(m => m.LoginPageModule),
    canActivate: [LoginGuard],
  },
  {
    path: 'register',
    loadChildren: () => import('./user/registration/user-create/user-create.module').then( m => m.UserCreatePageModule),
    canActivate: [LoginGuard],
  },
  {
    path: "add-restaurant/start",
    loadChildren: () => import('./user/add-restaurant/country/country.module').then( m => m.CountryPageModule),
    canActivate: [LoggedGuard],
  },
  {
    path: "add-restaurant/:restaurantId/name",
    loadChildren: () => import("./user/add-restaurant/name/name.module").then(m => m.NamePageModule),
    canActivate: [LoggedGuard],
  },
  {
    path: 'add-restaurant/:restaurantId/dob',
    loadChildren: () => import('./user/add-restaurant/dob/dob.module').then( m => m.DobPageModule),
    canActivate: [LoggedGuard],
  },
  {
    path: 'add-restaurant/:restaurantId/address',
    loadChildren: () => import('./user/add-restaurant/address/address.module').then( m => m.AddressPageModule),
    canActivate: [LoggedGuard],
  },
  {
    path: 'add-restaurant/:restaurantId/choose-method',
    loadChildren: () => import('./user/add-restaurant/choose-method/choose-method.module').then( m => m.ChooseMethodPageModule),
    canActivate: [LoggedGuard],
  },
  {
    path: 'add-restaurant/:restaurantId/card',
    loadChildren: () => import('./user/add-restaurant/card/card.module').then( m => m.CardPageModule),
    canActivate: [LoggedGuard],
  },
  {
    path: 'add-restaurant/:restaurantId/bank-account',
    loadChildren: () => import('./user/add-restaurant/bank-account/bank-account.module').then( m => m.BankAccountPageModule),
    canActivate: [LoggedGuard],
  },
  {
    path: "add-restaurant/:restaurantId/theme",
    loadChildren: () => import("./user/add-restaurant/theme/theme.module").then(m => m.ThemePageModule),
    canActivate: [LoggedGuard],
  },
];


const restaurant: Routes = [
  {
    path: "restaurant/:restaurantId",
    loadChildren: () => import("./restaurant/restaurant.module").then(m => m.RestaurantPageModule),
    canActivate: [LoggedGuard, RestaurantGuard],
    runGuardsAndResolvers: "always",
  },
  {
    path: "dish/:restaurantId/:mode",
    loadChildren: () => import("./restaurant/dish/dish.module").then(m => m.DishPageModule),
    canActivate: [LoggedGuard, RestaurantGuard]
  },
  {
    path: "dish/:restaurantId/:mode/:dishId",
    loadChildren: () => import("./restaurant/dish/dish.module").then(m => m.DishPageModule),
    canActivate: [LoggedGuard, RestaurantGuard]
  },
  {
    path: "cooking/:restaurantId/:dishId",
    loadChildren: () => import("./restaurant/dish-cooking/dish-cooking.module").then(m => m.DishCookingPageModule),
    canActivate: [LoggedGuard, RestaurantGuard],
  },
];


const staff: Routes = [
  {
    path: "staff/:restaurantId/dashboard",
    loadChildren: () => import("./staff/dashboard/dashboard.module").then(m => m.DashboardPageModule),
    canActivate: [LoggedGuard, StaffGuard]
  },
  {
    path: "staff/:restaurantId/kitchen",
    loadChildren: () => import("./staff/kitchen/main/main.module").then(m => m.MainPageModule),
    canActivate: [LoggedGuard, StaffGuard],
  },
  {
    path: "staff/:restaurantId/waiter",
    loadChildren: () => import("./staff/waiter/waiter/waiter.module").then(m => m.WaiterPageModule),
    canActivate: [LoggedGuard, StaffGuard],
  }
];


const routes: Routes = [
  {
    path: '',
    loadChildren: () => import("./ctraba/main/main.module").then(m => m.MainPageModule)
  },
  // {
  //   path: 'stripe-account',
  //   loadChildren: () => import('./user/add-restaurant/stripe-account/stripe-account.module').then( m => m.StripeAccountPageModule),
  //   canActivate: [LoggedGuard]
  // },
  ...staff,
  ...user,
  ...restaurant,
  {
    path: "**",
    redirectTo: "user/info"
  },
  // {
  //   path: 'dashboard',
  //   loadChildren: () => import('./staff/dashboard/dashboard.module').then( m => m.DashboardPageModule)
  // },
  // {
  //   path: 'theme',
  //   loadChildren: () => import('./user/add-restaurant/theme/theme.module').then( m => m.ThemePageModule)
  // },
  // {
  //   path: 'account',
  //   loadChildren: () => import('./user/account/account.module').then( m => m.AccountPageModule)
  // },
  // {
  //   path: 'name',
  //   loadChildren: () => import('./user/registration/name/name.module').then( m => m.NamePageModule)
  // },
  // {
  //   path: 'avatar',
  //   loadChildren: () => import('./user/registration/avatar/avatar.module').then( m => m.AvatarPageModule)
  // },
  // {
  //   path: 'bank-account',
  //   loadChildren: () => import('./user/add-restaurant/bank-account/bank-account.module').then( m => m.BankAccountPageModule)
  // },
];
  
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' }),
    BrowserAnimationsModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
