import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-component',
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.scss'],
})
export class ComponentComponent implements OnInit {

  value: number = null;
  color = "dark";

  constructor() { };

  @Input() component: any;
  @Output() Emitter = new EventEmitter();


  add() {
    if(!this.value || this.value == 0) {
      this.color = "danger";
      return;
    }
    this.color = "dark";
    this.Emitter.emit({ component: this.component, value: this.value });
  }


  ngOnInit() {

  }

}
