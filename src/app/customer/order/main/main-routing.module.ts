import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainPage } from './main.page';

const routes: Routes = [
  {
    path: '',
    component: MainPage,
    children: [
      {
        path: 'category/:category',
        loadChildren: () => import('./category-list/category-list.module').then( m => m.CategoryListPageModule)
      },
      {
        path: '',
        loadChildren: () => import('./recommendations/recommendations.module').then( m => m.RecommendationsPageModule)
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainPageRoutingModule {}
