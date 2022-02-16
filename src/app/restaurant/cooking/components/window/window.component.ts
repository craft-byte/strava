import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Component as C } from 'src/models/radmin';
import { RadminService } from '../../../radmin.service';

@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  styleUrls: ['./window.component.scss'],
})
export class WindowComponent implements OnInit {

  fullType: string;
  name: string;
  amount: number = null;
  price: number = null;
  type: string = "g";

  constructor(
    private service: RadminService
  ) { };


  @Input() component: C;
  @Input() windowType: "edit" | "remove" | "add";
  @Input() restaurant: string;
  @Output() Emitter = new EventEmitter();
  


  async save() {
    const component = {name: this.name, amount: this.amount, type: this.type, price: this.price};
    if(this.type == "k") {
      component.amount *= 1000;
    }
    const result = await this.service.post<C>({ component }, "components/add", this.restaurant);
    this.name = this.amount = this.price = null;
    this.quit({ type: "added", data: result });
  }
  fullTypeInit() {
    switch (this.type) {
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
  async remove() {
    const result = await this.service
      .delete<{acknowledged: boolean}>("components", "remove", this.restaurant, this.component._id as string);


    this.quit({ type: result.acknowledged ? "removed" : "error", data: { _id: this.component._id } });
  }

  async edit() {
    const updated = { price: this.component.price, amount: this.component.amount, name: this.component.name };
    const result = await this.service
      .patch<{ acknowledged: boolean }>({changed: updated}, "components/edit", this.restaurant, this.component._id as string);
    if(result.acknowledged) {
      return this.quit({ type: "edited", data: { _id: this.component._id, updated: Object.assign(this.component, updated) } });
    }
    this.quit({ type: "error" });
  }

  quit(data: any) {
    this.Emitter.emit(data);
  }

  async ngOnInit() {
    if(this.component) {
      this.component = JSON.parse(JSON.stringify(this.component));
      this.type = this.component.type; 
    }
    this.fullTypeInit();
  }

}
