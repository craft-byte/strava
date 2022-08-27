import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FullPageRoutingModule } from './full-routing.module';

import { FullPage } from './full.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FullPageRoutingModule
  ],
  declarations: [FullPage]
})
export class FullPageModule {}
