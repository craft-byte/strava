import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoggedGuard } from './guards/logged.guard';
import { RestaurantGuard } from './guards/restaurant.guard';
import { LoginGuard } from './guards/login.guard';
import { StaffGuard } from './guards/staff.guard';
import { KitchenSocketIdGuard } from './guards/kitchen-socket-id.guard';
import { WaiterSocketIdGuard } from './guards/waiter-socket-id.guard';
import { OrderGuard } from './guards/order.guard';

const registration: Routes = [
    {
      path: 'registration',
      loadChildren: () => import('./user/registration/registration.module').then( m => m.RegistrationPageModule),
      canActivate: [LoginGuard],
    },
];

const reset: Routes = [
    {
        path: "user/reset-email",
        loadChildren: () => import("./user/email-reset/email-reset.module").then(m => m.EmailResetPageModule),
        canActivate: [LoggedGuard],
    },
    // {
    //     path: "user/reset-password",
    // }
]

const user: Routes = [
    ...registration,
    ...reset,
    {
        path: 'user/info',
        loadChildren: () => import('./user/user-info/user-info.module').then(m => m.UserInfoPageModule),
        canActivate: [LoggedGuard],
        runGuardsAndResolvers: "always",
    },
    {
        path: "user/profile",
        loadChildren: () => import("./user/profile/profile.module").then(m => m.ProfilePageModule),
        canActivate: [LoggedGuard],
    },

    {
        path: "user/email/verification",
        loadChildren: () => import("./user/email-verification/email-verification.module").then(m => m.EmailVerificationPageModule),
        canActivate: [LoggedGuard],
    },


    {
        path: "user/avatar/:type",
        loadChildren: () => import("./user/registration/avatar/avatar.module").then(m => m.AvatarPageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: 'user/settings',
        loadChildren: () => import('./user/settings/settings.module').then(m => m.SettingsPageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: "login",
        loadChildren: () => import("./user/login/login.module").then(m => m.LoginPageModule),
        canActivate: [LoginGuard],
    },
    {
        path: "add-restaurant/start",
        loadChildren: () => import('./user/add-restaurant/country/country.module').then(m => m.CountryPageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: "add-restaurant/:restaurantId/name",
        loadChildren: () => import("./user/add-restaurant/name/name.module").then(m => m.NamePageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: 'add-restaurant/:restaurantId/dob',
        loadChildren: () => import('./user/add-restaurant/dob/dob.module').then(m => m.DobPageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: 'add-restaurant/:restaurantId/address',
        loadChildren: () => import('./user/add-restaurant/address/address.module').then(m => m.AddressPageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: 'add-restaurant/:restaurantId/choose-method',
        loadChildren: () => import('./user/add-restaurant/choose-method/choose-method.module').then(m => m.ChooseMethodPageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: 'add-restaurant/:restaurantId/card',
        loadChildren: () => import('./user/add-restaurant/card/card.module').then(m => m.CardPageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: 'add-restaurant/:restaurantId/bank-account',
        loadChildren: () => import('./user/add-restaurant/bank-account/bank-account.module').then(m => m.BankAccountPageModule),
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
        canActivate: [LoggedGuard, StaffGuard, KitchenSocketIdGuard],
    },
    {
        path: "staff/:restaurantId/waiter",
        loadChildren: () => import("./staff/waiter/waiter/waiter.module").then(m => m.WaiterPageModule),
        canActivate: [LoggedGuard, StaffGuard, WaiterSocketIdGuard],
    }
];
const customer: Routes = [
    {
        path: "customer",
        loadChildren: () => import("./customer/customer.module").then(m => m.CustomerPageModule),
        canActivate: [LoggedGuard]
    },
    {
        path: "customer/order/:restaurantId",
        loadChildren: () => import("./customer/order/main/main.module").then(m => m.MainPageModule),
        canActivate: [LoggedGuard, OrderGuard],
    },
    {
        path: "customer/order/:restaurantId/dish/:dishId",
        loadChildren: () => import("./customer/order/dish/dish.module").then(m => m.DishPageModule),
        canActivate: [LoggedGuard, OrderGuard],
    },
    {
        path: "customer/order/:restaurantId/checkout",
        loadChildren: () => import("./customer/order/checkout/checkout.module").then(m => m.CheckoutPageModule),
        canActivate: [LoggedGuard, OrderGuard],
    },
    {
        path: 'customer/tracking/:restaurantId',
        loadChildren: () => import('./customer/order/tracking/tracking.module').then(m => m.TrackingPageModule),
        canActivate: [LoggedGuard, OrderGuard],
    },
];


const routes: Routes = [
    {
        path: '',
        loadChildren: () => import("./ctraba/main/main.module").then(m => m.MainPageModule)
    },
    ...staff,
    ...user,
    ...restaurant,
    ...customer,
    {
        path: "**",
        redirectTo: "user/info"
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
