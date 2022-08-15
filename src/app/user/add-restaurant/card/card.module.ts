import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CardPageRoutingModule } from './card-routing.module';
import { CreditCardDirectivesModule } from 'angular-cc-library';

import { CardPage } from './card.page';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CardPageRoutingModule,
    ReactiveFormsModule,
    CreditCardDirectivesModule,
  ],
  declarations: [CardPage]
})
export class CardPageModule {}
