import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SoloPage } from './solo.page';

const routes: Routes = [
  {
    path: '',
    component: SoloPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SoloPageRoutingModule {}
