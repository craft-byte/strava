import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DishesListComponent } from './dishes-list.component';
import { IonicModule } from '@ionic/angular';



@NgModule({
  declarations: [DishesListComponent],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: "",
        component: DishesListComponent
      }
    ])
  ]
})
export class DishesListModule { }
