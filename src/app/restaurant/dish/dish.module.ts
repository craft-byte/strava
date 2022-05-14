import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DishPageRoutingModule } from './dish-routing.module';
import { ImageCropperModule } from 'ngx-image-cropper';
import { DishPage } from './dish.page';
import { ImageCropperModalPage } from './image-cropper-modal/image-cropper-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    DishPageRoutingModule,
    ImageCropperModule
  ],
  declarations: [
    DishPage,
    ImageCropperModalPage
  ]
})
export class DishPageModule {}
