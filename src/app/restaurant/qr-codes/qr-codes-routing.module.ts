import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QrCodesPage } from './qr-codes.page';

const routes: Routes = [
  {
    path: '',
    component: QrCodesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QrCodesPageRoutingModule {}
