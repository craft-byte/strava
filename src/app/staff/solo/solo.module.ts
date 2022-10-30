import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SoloPageRoutingModule } from './solo-routing.module';

import { SoloPage } from './solo.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SoloPageRoutingModule
  ],
  declarations: [SoloPage]
})
export class SoloPageModule {}
