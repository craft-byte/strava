import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { NameModalPage } from './name-modal/name-modal.page';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    SettingsComponent,
    NameModalPage
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: "",
        pathMatch: "full",
        component: SettingsComponent
      }
    ])
  ]
})
export class SettingsModule { }
