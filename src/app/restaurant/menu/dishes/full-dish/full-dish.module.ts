import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FullDishPageRoutingModule } from './full-dish-routing.module';

import { FullDishPage } from './full-dish.page';
import { AnalyticsComponent } from './analytics/analytics.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FullDishPageRoutingModule,
    NgxChartsModule,
  ],
  declarations: [FullDishPage, AnalyticsComponent]
})
export class FullDishPageModule {}
