import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StaffComponent } from './staff.component';
import { WindowModule } from '../window.module';
import { WorkerComponent } from './worker/worker.component';
import { MoreComponent } from './more/more.component';
import { IonicModule } from '@ionic/angular';
import { InvitingsWindowComponent } from './invitings-window/invitings-window.component';



@NgModule({
  declarations: [
    StaffComponent,
    WorkerComponent,
    MoreComponent,
    InvitingsWindowComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
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
