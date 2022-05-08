import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InviteUserPageRoutingModule } from './invite-user-routing.module';

import { InviteUserPage } from './invite-user.page';
import { IonicRatingComponentModule } from 'ionic-rating-component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InviteUserPageRoutingModule,
    IonicRatingComponentModule
  ],
  declarations: [InviteUserPage]
})
export class InviteUserPageModule {}
