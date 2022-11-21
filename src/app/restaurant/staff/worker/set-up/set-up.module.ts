import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SetUpPageRoutingModule } from './set-up-routing.module';

import { SetUpPage } from './set-up.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SetUpPageRoutingModule
  ],
  declarations: [SetUpPage]
})
export class SetUpPageModule {}
