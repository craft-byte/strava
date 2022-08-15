import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DobPageRoutingModule } from './dob-routing.module';

import { DobPage } from './dob.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DobPageRoutingModule,
    ReactiveFormsModule,
  ],
  declarations: [DobPage]
})
export class DobPageModule {}
