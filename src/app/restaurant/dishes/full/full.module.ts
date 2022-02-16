import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FullComponent } from './full.component';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PricesaleComponent } from './pricesale/pricesale.component';



@NgModule({
  declarations: [
    FullComponent,
    PricesaleComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: "",
        component: FullComponent
      }
    ])
  ]
})
export class FullModule { }
