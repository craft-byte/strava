import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SettingsPageRoutingModule } from './settings-routing.module';
import { IonicRatingComponentModule } from 'ionic-rating-component';
import { SettingsPage } from './settings.page';
import { FirePage } from './fire/fire.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SettingsPageRoutingModule,
    IonicRatingComponentModule
  ],
  declarations: [SettingsPage, FirePage]
})
export class SettingsPageModule {}
