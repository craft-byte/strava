import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WaiterPageRoutingModule } from './waiter-routing.module';

import { WaiterPage } from './waiter.page';
import { DishComponent } from './dish/dish.component';
import { DishModalPage } from './dish-modal/dish-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WaiterPageRoutingModule
  ],
  declarations: [
    WaiterPage,
    DishComponent,
    DishModalPage,
  ]
})
export class WaiterPageModule {}
