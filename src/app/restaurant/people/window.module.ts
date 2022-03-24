import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IonicRatingComponentModule } from 'ionic-rating-component';
import { FeedbackComponent } from './window/feedback/feedback.component';
import { WindowComponent } from './window/window.component';



@NgModule({
  declarations: [WindowComponent, FeedbackComponent],
  imports: [CommonModule, IonicModule, FormsModule, IonicRatingComponentModule],
  exports: [WindowComponent]
})
export class WindowModule { }
