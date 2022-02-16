import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RadminPageRoutingModule } from './radmin-routing.module';

import { RadminPage } from './radmin.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RadminPageRoutingModule,
    ReactiveFormsModule,
  ],
  declarations: [
    RadminPage,
  ]
})
export class RadminPageModule {}
