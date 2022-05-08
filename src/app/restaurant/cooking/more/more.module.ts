import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MoreComponent } from './more.component';
import { IonicModule } from '@ionic/angular';



@NgModule({
  declarations: [
    MoreComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: "",
        component: MoreComponent
      }
    ])
  ]
})
export class MoreModule { }
