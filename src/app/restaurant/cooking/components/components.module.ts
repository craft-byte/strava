import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComponentsComponent } from './components.component';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentComponent } from './component/component.component';
import { InfoComponent } from './info/info.component';
import { ShareModule } from './share.module';



@NgModule({
  declarations: [
    ComponentsComponent,
    ComponentComponent,
    InfoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ShareModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: "",
        component: ComponentsComponent
      },
    ])
  ]
})
export class ComponentsModule { }
