import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EmailResetPageRoutingModule } from './email-reset-routing.module';

import { EmailResetPage } from './email-reset.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EmailResetPageRoutingModule,
    ReactiveFormsModule,
  ],
  declarations: [EmailResetPage]
})
export class EmailResetPageModule {}
