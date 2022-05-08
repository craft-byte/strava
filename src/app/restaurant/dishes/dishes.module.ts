import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DishesComponent } from './dishes.component';



@NgModule({
  declarations: [
    DishesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: "",
        component: DishesComponent,
        children: [
          {
            path: "",
            pathMatch: "full",
            redirectTo: "overview"
          },
          {
            path: "overview",
            loadChildren: () => import("./overview/overview.module").then(m => m.OverviewModule)
          },
          {
            path: "settings",
            loadChildren: () => import("./settings/settings.module").then(m => m.SettingsModule)
          },
          {
            path: "full/:id",
            loadChildren: () => import("./full/full.module").then(m => m.FullModule),
          }
        ]
      }
    ])
  ]
})
export class DishesModule { }
