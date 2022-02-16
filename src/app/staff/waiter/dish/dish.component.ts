import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SmallDish } from 'src/models/staff';
import { StaffService } from '../../staff.service';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit {

  dish: { name: string };
  image: string;

  constructor(
    private service: StaffService
  ) { };

  @Input() data: SmallDish;
  @Input() type: "order" | "table";
  @Output() Done = new EventEmitter();

  done() {
    this.Done.emit(this.data._id);
  }
  close() {
    this.image = null;
  }
  async info() {
    this.image = (await this.service.get<{ image: string }>(["image"], [this.service.sname, this.data.dishId])).image;
  }

  async ngOnInit() {
    // this.dish = await this.service.getKitchenDish(this.data.dishId as string);
    this.dish = await this.service.get(["kitchenDish"], [this.service.sname, this.data.dishId]);
  }

}
