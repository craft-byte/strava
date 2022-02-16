import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { WindowComponent } from './window/window.component';



@NgModule({
  declarations: [WindowComponent],
  imports: [CommonModule, IonicModule, FormsModule],
  exports: [WindowComponent]
})
export class WindowModule { }
