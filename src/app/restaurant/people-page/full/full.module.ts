import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FullPageRoutingModule } from './full-routing.module';
import { FullPage } from './full.page';
import { ModalPage } from './more-modal/modal.page';
import { FireModalPage } from './fire-modal/fire-modal.page';
import { IonicRatingComponentModule } from 'ionic-rating-component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FullPageRoutingModule,
    IonicRatingComponentModule
  ],
  declarations: [FullPage, ModalPage, FireModalPage]
})
export class FullPageModule {}
