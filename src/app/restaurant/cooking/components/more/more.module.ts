import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MoreComponent } from './more.component';
import { ShareModule } from '../share.module';



@NgModule({
  declarations: [
    MoreComponent
  ],
  imports: [
    CommonModule,
    ShareModule,
    RouterModule.forChild([
      {
        path: "",
        component: MoreComponent
      }
    ])
  ]
})
export class MoreModule { }
