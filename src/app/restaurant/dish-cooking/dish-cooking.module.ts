import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DishCookingPageRoutingModule } from './dish-cooking-routing.module';

import { DishCookingPage } from './dish-cooking.page';
import { ComponentComponent } from './component/component.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DishCookingPageRoutingModule
  ],
  declarations: [
    DishCookingPage,
    ComponentComponent
  ]
})
export class DishCookingPageModule {}
