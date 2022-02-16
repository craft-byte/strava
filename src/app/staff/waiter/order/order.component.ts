import { Component, Input, OnInit } from '@angular/core';
import { ForWaiter } from 'src/models/staff';
import { StaffService } from '../../staff.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
})
export class OrderComponent implements OnInit {

  constructor(
    private service: StaffService
  ) { };

  @Input() data: ForWaiter;

  done(id: string) {
    for(let i in this.data.dishes) {
      if(this.data.dishes[i]._id === id) {
        this.data.dishes.splice(+i, 1);
        this.service.waiterDone(this.data._id as string, id);
        if(this.data.dishesLength === 0 && this.data.type === 'table' && this.data.dishes.length === 0) {
          this.service.waiterFullDone(this.data._id as string);
          this.data = null;
        }
        return;
      }
    }
  }
  given() {
    this.service.waiterFullDone(this.data._id as string);
    this.data = null;
  }

  ngOnInit() {
    
  }

}
