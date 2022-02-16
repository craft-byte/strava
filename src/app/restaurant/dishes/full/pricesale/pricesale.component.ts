import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-pricesale',
  templateUrl: './pricesale.component.html',
  styleUrls: ['./pricesale.component.scss'],
})
export class PricesaleComponent implements OnInit {

  date: string;

  constructor() { };

  @Input() data: any;
  @Output() Emitter = new EventEmitter();

  use() {
    this.Emitter.emit({ id: this.data._id, t: "use" });
  }
  remove() {
    this.Emitter.emit({ id: this.data._id, t: "remove" });
  }

  ngOnInit() {
    this.date = new Date(this.data.created).toLocaleDateString();
  }

}
