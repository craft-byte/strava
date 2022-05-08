import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Component as C } from 'src/models/components';
import { InfoComponent } from '../info/info.component';

@Component({
  selector: 'app-component',
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.scss'],
})
export class ComponentComponent implements OnInit {


  constructor(
    private popoverController: PopoverController
  ) { };

  @Input() data: C;
  @Output() Emitter = new EventEmitter();

  async info(ev: any) {
    const popover = await this.popoverController.create({
      component: InfoComponent,
      event: ev,
      translucent: false,
      mode: "ios",
    });
    await popover.present();

    const { role } = await popover.onDidDismiss();

    this.Emitter.emit({ role, data: this.data });
    
  }
  more() {
    this.Emitter.emit({ role: "more", data: this.data });
  }


  ngOnInit() {
  }

}
