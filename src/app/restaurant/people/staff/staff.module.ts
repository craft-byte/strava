import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StaffComponent } from './staff.component';
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
    RouterModule.forChild([
      {
        path: "",
        component: StaffComponent
      }
    ])
  ]
})
export class StaffModule { }
