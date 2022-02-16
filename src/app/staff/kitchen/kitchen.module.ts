import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KitchenPageRoutingModule } from './kitchen-routing.module';

import { KitchenPage } from './kitchen.page';
import { OrderComponent } from './order/order.component';
import { DishComponent } from './dish/dish.component';
import { InfoComponent } from './info/info.component';
import { TypeComponent } from '../type/type.component';
import { SettingsComponent } from './settings/settings.component';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KitchenPageRoutingModule,
    // BrowserAnimationsModule
  ],
  declarations: [
    KitchenPage,
    OrderComponent,
    DishComponent,
    InfoComponent,
    TypeComponent,
    SettingsComponent
  ]
})
export class KitchenPageModule {}
