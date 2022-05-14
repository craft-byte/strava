import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MoreComponent } from './more.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { IonicRatingComponentModule } from 'ionic-rating-component';
import { SettingsModalPage } from '../settings-modal/settings-modal.page';
import { FirePage } from '../fire/fire.page';


@NgModule({
  declarations: [
    MoreComponent,
    SettingsModalPage,
    FirePage
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    IonicRatingComponentModule,
    RouterModule.forChild([
      {
        path: "",
        component: MoreComponent
      }
    ])
  ]
})
export class MoreModule { }
