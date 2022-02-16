import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Custom } from 'src/models/customer';
import { StaffService } from '../../staff.service';
import { SettingsComponent } from '../settings/settings.component';



@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
})
export class OrderComponent implements OnInit {

  class = "app";
  showDishes = true;
  closed = true;
  sett = false;


  fromTime: string = null;
  toTime: string = null;

  hoursDelay: number = null;
  minutesDelay: number = null;

  constructor(
    private service: StaffService,
    private popoverController: PopoverController
  ) {
    if(window.innerWidth < 1000) {
      this.showDishes = false;
    }
  };

  @Input() data: Custom;

  async settings(ev: any) {
    const popover = await this.popoverController.create({
      component: SettingsComponent,
      cssClass: 'my-custom-class',
      event: ev,
      translucent: true
    });
    await popover.present();
  
    const { role } = await popover.onDidDismiss();
    
    switch (role) {
      case 'remove':
        this.removeOrder();
        break;
    }
  }
  removeDish({ _id, types }: { _id: string; types: string[] }) {
    this.service.removeDish({ _id, orderId: this.data._id as string });
    for(let i in this.data.dishes) {
      if(this.data.dishes[i]._id === _id) {
        this.data.dishes.splice(+i, 1);
        this.removeTypes(types);
        if(this.data.dishes.length === 0) {
          this.service.doneOrder(this.data._id as string);
          this.data = null;
        }
        return;
      }
    }
  }
  removeOrder() {
    this.service.removeOrder(this.data._id as string);
    this.data = null;
  }
  doneDish({ dishId, _id, types }: { _id: string; dishId: string; types: string[] }) {
    for(let i in this.data.dishes) {
      if(this.data.dishes[i]._id === _id) {
        this.service.doneDish(dishId, this.data._id as string, _id, types);
        this.data.dishes.splice(+i, 1);
        this.removeTypes(types);
        if(this.data.dishes.length === 0) {
          this.service.doneOrder(this.data._id as string);
          this.data = null;
        }
        return;
      }
    }
  }
  removeTypes(types: string[]) {
    for(let i of types) {
      for(let j in this.data.types) {
        if(i === this.data.types[j].n) {
          this.data.types[j].q--;
          if(this.data.types[j].q === 0) {
            this.data.types.splice(+j, 1);
            break;
          }
        }
      }
    }
  }
  takeDish({ id: _id, take }: { id: string; take: boolean }) {
    this.service.takeDish({ _id, orderId: this.data._id as string }, take);
  }
  parseTime(time: Date) {
    const date = new Date(time);
    return `${date.getHours()}:${date.getMinutes()}`;
  }
  delay(from: Date) {
    const date = new Date(from).getTime() - new Date().getTime();

    if(date < 1000) {
      const delayDate = (-date);
      this.hoursDelay = Math.floor(delayDate / 3600000);
      this.minutesDelay = Math.floor(delayDate / 60000);

      if(this.minutesDelay > 59) {
        const toBe = this.minutesDelay % 60;
        const toAdd = Math.floor(this.minutesDelay / 60);

        this.hoursDelay += toAdd;
        this.minutesDelay = toBe
      }

      setInterval(() => {
        this.minutesDelay++;
        if(this.minutesDelay === 60) {
          this.minutesDelay = 0;
          this.hoursDelay++;
        }
      }, 60000)
    }
  }
  getTypes(types: string[]) {
    for(let i of types) {
      let add = true;
      for(let j of this.data.types) {
        if(j.n === i) {
          add = false;
          j.q++;
          break;
        }
      }
      if(add) {
        this.data.types.push({ q: 1, n: i });
      }
    }
  }
  more() {
    this.closed = !this.closed;
    if(this.class === "app") {
      this.class = "app change";
    } else {
      this.class = "app"
    }
  }

  ngOnInit() {
    this.data.types = [];
    this.fromTime = this.parseTime(this.data.fromTime);
    this.toTime = this.parseTime(this.data.toTime);

    if(this.data.type === "order") {
      this.delay(this.data.toTime);
    } else {
      this.delay(this.data.fromTime);
    }

    
  }

}
