import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomersComponent } from './customers.component';
import { OrderComponent } from './order/order.component';



@NgModule({
  declarations: [
    CustomersComponent,
    OrderComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: "",
        component: CustomersComponent
      }
    ])
  ]
})
export class CustomersModule { }
