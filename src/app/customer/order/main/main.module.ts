import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MainPageRoutingModule } from './main-routing.module';

import { MainPage } from './main.page';
import { CategoryComponent } from './category/category.component';
import { PreviewPage } from '../preview/preview.page';
import { RouteReuseStrategy } from '@angular/router';
import { AARouteReuseStrategy } from 'src/app/other/route-strategy';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MainPageRoutingModule,
    // TableModule,
  ],
  declarations: [MainPage, CategoryComponent, PreviewPage,],
  providers: [
    {
        provide: RouteReuseStrategy,
        useClass: AARouteReuseStrategy
    }
  ]
})
export class MainPageModule {}
