import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KitchenPageRoutingModule } from './kitchen-routing.module';

import { KitchenPage } from './kitchen.page';
import { DepartmentModalPage } from '../department-modal/department-modal.page';
import { DishComponent } from '../dish/dish.component';
import { DishPage } from '../dish-modal/dish-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KitchenPageRoutingModule,
  ],
  declarations: [
    KitchenPage,
    DepartmentModalPage,
    DishComponent,
    DishPage
  ],
})
export class KitchenPageModule {}
