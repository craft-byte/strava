import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Component as C } from 'src/models/radmin';
import { InfoComponent } from '../info/info.component';

var months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

@Component({
  selector: 'app-component',
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.scss'],
})
export class ComponentComponent implements OnInit {


  modified: string;
  fullType: string;


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

  fullTypeInit() {
    switch (this.data.type) {
      case "k":
        this.fullType = "Kilogram";
        break;
      case "g":
        this.fullType = "Gram";
        break;
      case "p":
        this.fullType = "Piece";
        break;
    }
  }


  ngOnInit() {
    // if(this.data.type == "k") {
    //   this.data.amount = this.data.amount / 1000;
    // }
    const date = new Date(this.data.modified);
    const month = months[date.getMonth()];
    this.modified = `${date.getDate()} ${month}`;
    this.fullTypeInit()
  }

}
