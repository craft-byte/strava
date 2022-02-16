import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DishesComponent } from './dishes.component';
import { RidGuard } from 'src/app/rid.guard';



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
            canActivate: [RidGuard]
          }
        ]
      }
    ])
  ]
})
export class DishesModule { }
