import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DishCookingPageRoutingModule } from './dish-cooking-routing.module';

import { DishCookingPage } from './dish-cooking.page';
import { IngredientModalPage } from './ingredient-modal/ingredient-modal.page';
import { AddIngredientPage } from './add-ingredient/add-ingredient.page';
import { IngredientPage } from './ingredient/ingredient.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DishCookingPageRoutingModule
  ],
  declarations: [
    DishCookingPage,
    IngredientModalPage,
    AddIngredientPage,
    IngredientPage,
  ]
})
export class DishCookingPageModule {}
