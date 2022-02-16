import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DishPageRoutingModule } from './dish-routing.module';

import { DishPage } from './dish.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    DishPageRoutingModule
  ],
  declarations: [DishPage]
})
export class DishPageModule {}
