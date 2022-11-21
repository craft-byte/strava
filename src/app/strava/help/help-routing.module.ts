import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HelpPage } from './help.page';

const routes: Routes = [
  {
    path: '',
    component: HelpPage,
    children: [
        {
            path: "",
            pathMatch: "full",
            redirectTo: "start",
        },
        {
            path: 'start',
            loadChildren: () => import('./start/start.module').then( m => m.StartPageModule)
        },
        {
            path: 'dishes',
            loadChildren: () => import('./dishes/dishes.module').then( m => m.DishesPageModule)
        },
        {
            path: 'modes',
            loadChildren: () => import('./mode/mode.module').then( m => m.ModePageModule)
        }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HelpPageRoutingModule {}
