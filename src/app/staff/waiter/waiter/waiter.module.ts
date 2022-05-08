import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WaiterPageRoutingModule } from './waiter-routing.module';

import { WaiterPage } from './waiter.page';
import { DishComponent } from './dish/dish.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WaiterPageRoutingModule
  ],
  declarations: [
    WaiterPage,
    DishComponent
  ]
})
export class WaiterPageModule {}
