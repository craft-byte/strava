import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StaffComponent } from './staff.component';
import { IonicModule } from '@ionic/angular';



@NgModule({
  declarations: [
    StaffComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: StaffComponent
      }
    ])
  ]
})
export class StaffModule { }
