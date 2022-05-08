import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WorkerSetUpPageRoutingModule } from './worker-set-up-routing.module';

import { WorkerSetUpPage } from './worker-set-up.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WorkerSetUpPageRoutingModule
  ],
  declarations: [WorkerSetUpPage]
})
export class WorkerSetUpPageModule {}
