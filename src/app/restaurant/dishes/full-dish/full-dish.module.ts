import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FullDishPageRoutingModule } from './full-dish-routing.module';

import { FullDishPage } from './full-dish.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FullDishPageRoutingModule
  ],
  declarations: [FullDishPage]
})
export class FullDishPageModule {}
