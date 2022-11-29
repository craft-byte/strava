import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { QrCodesPageRoutingModule } from './qr-codes-routing.module';

import { QrCodesPage } from './qr-codes.page';
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QrCodesPageRoutingModule,
    QRCodeModule
  ],
  declarations: [QrCodesPage]
})
export class QrCodesPageModule {}
