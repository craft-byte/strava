import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-resuloution',
  templateUrl: './resuloution.component.html',
  styleUrls: ['./resuloution.component.scss'],
})
export class ResuloutionComponent implements OnInit {

  constructor(
    private pc: PopoverController
  ) { };

  role(s: string) {
    this.pc.dismiss(null, s);
  }

  ngOnInit() {}

}
