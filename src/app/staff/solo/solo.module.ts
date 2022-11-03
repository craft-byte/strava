import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SoloPageRoutingModule } from './solo-routing.module';

import { SoloPage } from './solo.page';
import { CookComponent } from './cook/cook.component';
import { WaiterComponent } from './waiter/waiter.component';
import { DishComponent as CookDishComponent } from './cook/dish/dish.component';
import { DishComponent as WaiterDishComponent } from './waiter/dish/dish.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SoloPageRoutingModule
  ],
  declarations: [SoloPage, CookComponent, WaiterComponent, CookDishComponent, WaiterDishComponent]
})
export class SoloPageModule {}
