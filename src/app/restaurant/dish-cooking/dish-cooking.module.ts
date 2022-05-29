import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DishCookingPageRoutingModule } from './dish-cooking-routing.module';

import { DishCookingPage } from './dish-cooking.page';
import { IngredientComponent } from './ingredient/ingredient.component';
import { IngredientModalPage } from './ingredient-modal/ingredient-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DishCookingPageRoutingModule
  ],
  declarations: [
    DishCookingPage,
    IngredientComponent,
    IngredientModalPage,
  ]
})
export class DishCookingPageModule {}
