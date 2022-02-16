import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PeopleComponent } from './people.component';



@NgModule({
  declarations: [
    PeopleComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: "",
        component: PeopleComponent,
        children: [
          {
            path: "",
            pathMatch: "full",
            redirectTo: "staff"
          },
          {
            path: "staff",
            loadChildren: () => import("./staff/staff.module").then(m => m.StaffModule)
          },
          {
            path: "customers",
            loadChildren: () => import("./customers/customers.module").then(m => m.CustomersModule)
          },
          {
            path: "settings",
            loadChildren: () => import("./settings/settings.module").then(m => m.SettingsModule)
          },
          {
            path: "staff/more/:id",
            loadChildren: () => import("./more/more.module").then(m => m.MoreModule)
          }
        ]
      }
    ])
  ]
})
export class PeopleModule { }
