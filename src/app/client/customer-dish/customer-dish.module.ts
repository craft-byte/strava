import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CustomerDishPageRoutingModule } from './customer-dish-routing.module';

import { CustomerDishPage } from './customer-dish.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CustomerDishPageRoutingModule
  ],
  declarations: [CustomerDishPage]
})
export class CustomerDishPageModule {}
