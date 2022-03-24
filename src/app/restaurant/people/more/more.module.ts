import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MoreComponent } from './more.component';
import { IonicModule } from '@ionic/angular';
import { SettingsWindowComponent } from './settings-window/settings-window.component';
import { FormsModule } from '@angular/forms';
import { WorkerSettingsComponent } from './worker-settings/worker-settings.component';
import { FiringWindowComponent } from './firing-window/firing-window.component';
import { IonicRatingComponentModule } from 'ionic-rating-component';


@NgModule({
  declarations: [
    MoreComponent,
    SettingsWindowComponent,
    WorkerSettingsComponent,
    FiringWindowComponent
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
