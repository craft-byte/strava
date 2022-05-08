import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WorkerSetUpPage } from './worker-set-up.page';

const routes: Routes = [
  {
    path: '',
    component: WorkerSetUpPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkerSetUpPageRoutingModule {}
