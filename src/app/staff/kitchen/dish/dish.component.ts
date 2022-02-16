import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SmallDish } from 'src/models/staff';
import { StaffService } from '../../staff.service';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit {


  dish: { name: string; types: string[]; } = null;
  username: string;

  constructor(
    private service: StaffService,
  ) {
    this.username = this.service.username;
  };

  @Input() data: SmallDish;
  @Input() full: boolean;

  @Output() SendTypes = new EventEmitter();
  @Output() Done = new EventEmitter();
  @Output() Take = new EventEmitter();
  @Output() Remove = new EventEmitter();

  take() {
    this.Take.emit({ take: true, id: this.data._id })
  }
  done() {
    this.Done.emit({_id: this.data._id, dishId: this.data.dishId, types: this.dish.types });
  }
  remove() {
    this.Remove.emit({ _id: this.data._id, types: this.dish.types });
  }
  untake() {
    this.Take.emit({ take: false, id: this.data._id })
  }
  info() {
    this.service.infoId.next(this.data.dishId);
  }

  async ngOnInit() {
    this.dish = await this.service.get(["kitchenDish"], [this.service.sname, this.data.dishId]);
    this.SendTypes.emit(this.dish.types);
  }

}
