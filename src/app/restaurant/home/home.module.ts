import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomePageRoutingModule } from './home-routing.module';
import { NgxChartsModule } from "@swimlane/ngx-charts"
import { HomePage } from './home.page';
import { ChartsComponent } from './charts/charts.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    NgxChartsModule
  ],
  declarations: [
    HomePage,
    ChartsComponent,
  ],
})
export class HomePageModule {}
