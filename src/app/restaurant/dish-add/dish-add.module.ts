import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DishAddPageRoutingModule } from './dish-add-routing.module';

import { DishAddPage } from './dish-add.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DishAddPageRoutingModule,
    ReactiveFormsModule,
  ],
  declarations: [DishAddPage]
})
export class DishAddPageModule {}
