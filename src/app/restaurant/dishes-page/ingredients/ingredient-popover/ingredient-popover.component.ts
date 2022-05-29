import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-ingredient-popover',
  templateUrl: './ingredient-popover.component.html',
  styleUrls: ['./ingredient-popover.component.scss'],
})
export class IngredientPopoverComponent implements OnInit {

  constructor(
    private popoverCtrl: PopoverController
  ) { };

  go(n: number) {
    this.popoverCtrl.dismiss(n);
  }

  ngOnInit() {}

}
