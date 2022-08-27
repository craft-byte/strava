import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FullOrderPageRoutingModule } from './full-order-routing.module';

import { FullOrderPage } from './full-order.page';
import { DishComponent } from './dish/dish.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FullOrderPageRoutingModule
  ],
  declarations: [
    FullOrderPage,
    DishComponent
  ]
})
export class FullOrderPageModule {}
