import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StaffComponent } from './staff.component';
import { WindowModule } from '../window.module';
import { WorkerComponent } from './worker/worker.component';
import { MoreComponent } from './more/more.component';



@NgModule({
  declarations: [
    StaffComponent,
    WorkerComponent,
    MoreComponent,
  ],
  imports: [
    CommonModule,
    WindowModule,
    RouterModule.forChild([
      {
        path: "",
        component: StaffComponent
      }
    ])
  ]
})
export class StaffModule { }
