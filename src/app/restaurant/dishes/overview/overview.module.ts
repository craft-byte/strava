import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OverviewComponent } from './overview.component';
import { DishComponent } from './dish/dish.component';
import { SettingsComponent } from './settings/settings.component';



@NgModule({
  declarations: [
    OverviewComponent,
    DishComponent,
    SettingsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: "",
        component: OverviewComponent
      }
    ])
  ]
})
export class OverviewModule { }
