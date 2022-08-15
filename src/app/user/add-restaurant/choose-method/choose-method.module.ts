import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ChooseMethodPageRoutingModule } from './choose-method-routing.module';

import { ChooseMethodPage } from './choose-method.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ChooseMethodPageRoutingModule
  ],
  declarations: [ChooseMethodPage]
})
export class ChooseMethodPageModule {}
