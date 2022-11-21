import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoggedGuard } from './guards/logged.guard';
import { RestaurantGuard } from './guards/restaurant.guard';
import { LoginGuard } from './guards/login.guard';
import { StaffGuard } from './guards/staff.guard';
import { KitchenSocketIdGuard } from './guards/kitchen-socket-id.guard';
import { WaiterSocketIdGuard } from './guards/waiter-socket-id.guard';
import { OrderGuard } from './guards/order.guard';
import { SocketGuard } from './staff/solo/socket.guard';

const registration: Routes = [
    {
      path: 'register',
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
    {
        path: "user/reset-password",
        loadChildren: () => import("./user/password-reset/password-reset.module").then(m => m.PasswordResetPageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: "user/forgot-password",
        loadChildren: () => import("./user/forgot-password/forgot-password.module").then(m => m.ForgotPasswordPageModule),
    }
]

const addRestaurant: Routes = [
    {
        path: "add-restaurant/start",
        loadChildren: () => import('./user/add-restaurant/country/country.module').then(m => m.CountryPageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: "restaurant/:restaurantId/conf/name",
        loadChildren: () => import("./user/add-restaurant/name/name.module").then(m => m.NamePageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: 'restaurant/:restaurantId/conf/dob',
        loadChildren: () => import('./user/add-restaurant/dob/dob.module').then(m => m.DobPageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: 'restaurant/:restaurantId/conf/address',
        loadChildren: () => import('./user/add-restaurant/address/address.module').then(m => m.AddressPageModule),
        canActivate: [LoggedGuard],
    },
    // {
    //     path: 'add-restaurant/:restaurantId/choose-method',
    //     loadChildren: () => import('./user/add-restaurant/choose-method/choose-method.module').then(m => m.ChooseMethodPageModule),
    //     canActivate: [LoggedGuard],
    // },
    // {
    //     path: 'add-restaurant/:restaurantId/card',
    //     loadChildren: () => import('./user/add-restaurant/card/card.module').then(m => m.CardPageModule),
    //     canActivate: [LoggedGuard],
    // },
    {
        path: 'restaurant/:restaurantId/conf/bank-account',
        loadChildren: () => import('./user/add-restaurant/bank-account/bank-account.module').then(m => m.BankAccountPageModule),
        canActivate: [LoggedGuard],
    },
    {
        path: "restaurant/:restaurantId/conf/theme",
        loadChildren: () => import("./user/add-restaurant/theme/theme.module").then(m => m.ThemePageModule),
        canActivate: [LoggedGuard],
    },
]
const user: Routes = [
    ...registration,
    ...reset,
    ...addRestaurant,
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
        path: 'user/settings',
        loadChildren: () => import('./user/settings/settings.module').then(m => m.SettingsPageModule),
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
        path: "login",
        loadChildren: () => import("./user/login/login.module").then(m => m.LoginPageModule),
        canActivate: [LoginGuard],
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
        path: "dish/:restaurantId/add",
        loadChildren: () => import("./restaurant/dish-add/dish-add.module").then(m => m.DishAddPageModule),
        canActivate: [LoggedGuard, RestaurantGuard]
    },
    {
        path: "dish/:restaurantId/edit/:dishId",
        loadChildren: () => import("./restaurant/dish-edit/dish-edit.module").then(m => m.DishEditPageModule),
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
        path: "staff/:restaurantId/cook",
        loadChildren: () => import("./staff/kitchen/main/main.module").then(m => m.MainPageModule),
        canActivate: [LoggedGuard, StaffGuard, KitchenSocketIdGuard],
    },
    {
        path: "staff/:restaurantId/waiter",
        loadChildren: () => import("./staff/waiter/waiter/waiter.module").then(m => m.WaiterPageModule),
        canActivate: [LoggedGuard, StaffGuard, WaiterSocketIdGuard],
    },
    {
        path: "staff/:restaurantId/solo",
        loadChildren: () => import("./staff/solo/solo.module").then(m => m.SoloPageModule),
        canActivate: [LoggedGuard, StaffGuard, SocketGuard]
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
        canActivate: [OrderGuard],
    },
    {
        path: "customer/order/:restaurantId/dish/:dishId",
        loadChildren: () => import("./customer/order/dish/dish.module").then(m => m.DishPageModule),
        canActivate: [OrderGuard],
    },
    {
        path: "customer/order/:restaurantId/checkout",
        loadChildren: () => import("./customer/order/checkout/checkout.module").then(m => m.CheckoutPageModule),
        canActivate: [OrderGuard],
    },
    {
        path: 'customer/tracking/:restaurantId',
        loadChildren: () => import('./customer/order/tracking/tracking.module').then(m => m.TrackingPageModule),
        canActivate: [OrderGuard],
    },
];


const routes: Routes = [
    {
        path: '',
        loadChildren: () => import("./strava/main/main.module").then(m => m.MainPageModule)
    },
    {
        path: 'help',
        loadChildren: () => import('./strava/help/help.module').then( m => m.HelpPageModule)
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
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, onSameUrlNavigation: "reload" }),
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
