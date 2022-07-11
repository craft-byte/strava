import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EmailSetupPageRoutingModule } from './email-setup-routing.module';
import { CodeInputModule } from 'angular-code-input';
import { EmailSetupPage } from './email-setup.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EmailSetupPageRoutingModule,
    CodeInputModule,
  ],
  declarations: [EmailSetupPage]
})
export class EmailSetupPageModule {}
