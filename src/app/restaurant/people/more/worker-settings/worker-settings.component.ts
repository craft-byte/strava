import { Component, EventEmitter, OnInit, Output } from '@angular/core';


@Component({
  selector: 'app-worker-settings',
  templateUrl: './worker-settings.component.html',
  styleUrls: ['./worker-settings.component.scss'],
})
export class WorkerSettingsComponent implements OnInit {

  role: string = null;

  constructor() { };


  @Output() Emitter = new EventEmitter();


  fire() {
    this.Emitter.emit({ type: "fire" });
  }

  submit() {
    this.Emitter.emit({ type: "role", data: this.role });
  }

  quit() {
    this.Emitter.emit({ type: "quit" });
  }

  ngOnInit() {}

}
