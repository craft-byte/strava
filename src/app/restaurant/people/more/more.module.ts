import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MoreComponent } from './more.component';



@NgModule({
  declarations: [MoreComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: "",
        component: MoreComponent
      }
    ])
  ]
})
export class MoreModule { }
