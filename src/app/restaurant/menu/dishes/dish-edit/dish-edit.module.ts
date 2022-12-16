import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DishEditPageRoutingModule } from './dish-edit-routing.module';

import { DishEditPage } from './dish-edit.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DishEditPageRoutingModule,
    ReactiveFormsModule,
  ],
  declarations: [DishEditPage]
})
export class DishEditPageModule {}
