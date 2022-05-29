import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DishPageRoutingModule } from './dish-routing.module';
import { ImageCropperModule } from 'ngx-image-cropper';

import { DishPage } from './dish.page';
import { ImagePage } from './image/image.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DishPageRoutingModule,
    ReactiveFormsModule,
    ImageCropperModule
  ],
  declarations: [
    DishPage,
    ImagePage
  ]
})
export class DishPageModule {}