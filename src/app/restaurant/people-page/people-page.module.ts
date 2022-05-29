import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PeoplePagePageRoutingModule } from './people-page-routing.module';

import { PeoplePagePage } from './people-page.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PeoplePagePageRoutingModule
  ],
  declarations: [PeoplePagePage]
})
export class PeoplePagePageModule {}
