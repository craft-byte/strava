import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CookingComponent } from './cooking.component';



@NgModule({
  declarations: [CookingComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: "",
        component: CookingComponent,
        children: [
          {
            path: "",
            pathMatch: "full",
            redirectTo: "components"
          },
          {
            path: "components",
            loadChildren: () => import("./components/components.module").then(m => m.ComponentsModule)
          },
          {
            path: "settings",
            loadChildren: () => import("./settings/settings.module").then(m => m.SettingsModule)
          },
          {
            path: "components/more/:id",
            loadChildren: () => import("./components/more/more.module").then(m => m.MoreModule)
          }
        ]
      }
    ])
  ]
})
export class CookingModule { }
