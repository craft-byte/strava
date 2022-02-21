import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MoreComponent } from './more.component';
import { IonicModule } from '@ionic/angular';
import { SettingsWindowComponent } from './settings-window/settings-window.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    MoreComponent,
    SettingsWindowComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: "",
        component: MoreComponent
      }
    ])
  ]
})
export class MoreModule { }
