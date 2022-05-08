import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RestaurantGuard } from 'src/app/restaurant.guard';

import { RadminPage } from './radmin.page';

const routes: Routes = [
  {
    path: ':restaurantId',
    component: RadminPage,
    canActivate: [RestaurantGuard],
    children: [
      {
        path: "",
        pathMatch: "full",
        redirectTo: "home"
      },
      {
        path: "dishes",
        loadChildren: () => import("./../dishes/dishes.module").then(m => m.DishesModule)
      },
      {
        path: "cooking",
        loadChildren: () => import("./../cooking/cooking.module").then(m => m.CookingModule)
      },
      {
        path: "people",
        loadChildren: () => import("./../people/people.module").then(m => m.PeopleModule)
      },
      {
        path: "home",
        loadChildren: () => import("./../home/home.module").then(m => m.HomeModule)
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RadminPageRoutingModule {}
