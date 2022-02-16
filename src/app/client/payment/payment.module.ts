import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PaymentPageRoutingModule } from './payment-routing.module';

import { PaymentPage } from './payment.page';
import { DishComponent } from './dish/dish.component';
import { PaymentModalComponent } from './payment-modal/payment-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PaymentPageRoutingModule
  ],
  declarations: [
    PaymentPage, 
    DishComponent,
    PaymentModalComponent
  ]
})
export class PaymentPageModule {}
