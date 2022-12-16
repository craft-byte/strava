import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DishComponent } from './dish.component';



@NgModule({
  declarations: [
    DishComponent,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    DishComponent
  ]
})
export class DishModule { }
