import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DishesPageComponent } from './dishes-page.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    DishesPageComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: "",
        component: DishesPageComponent,
        children: [
          {
            path: "",
            pathMatch: "full",
            redirectTo: "list"
          },
          {
            path: "list",
            loadChildren: () => import("./dishes-list/dishes-list.module").then(m => m.DishesListModule)
          },
          {
            path: "ingredients",
            loadChildren: () => import("./ingredients/ingredients.module").then(m => m.IngredientsModule)
          }
        ]
      }
    ])
  ]
})
export class DishesPageModule { }
