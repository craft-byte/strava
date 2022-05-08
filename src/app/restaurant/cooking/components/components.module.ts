import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComponentsComponent } from './components.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentComponent } from './component/component.component';
import { InfoComponent } from './info/info.component';
import { AddWindowPage } from './add-window/add-window.page';
import { EditWindowPage } from './edit-window/edit-window.page';
import { UpdateWindowPage } from './update-window/update-window.page';



@NgModule({
  declarations: [
    ComponentsComponent,
    ComponentComponent,
    InfoComponent,
    AddWindowPage,
    EditWindowPage,
    UpdateWindowPage
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
