import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RadminService } from 'src/app/restaurant/radmin.service';

@Component({
  selector: 'app-settings-window',
  templateUrl: './settings-window.component.html',
  styleUrls: ['./settings-window.component.scss'],
})
export class SettingsWindowComponent implements OnInit {

  s: { title: string; value: boolean }[];

  constructor(
    private service: RadminService
  ) { };

  @Input() settings: any;
  @Input() type: string;
  @Input() workerId: string;
  @Output() Emitter = new EventEmitter<{ type: string }>();

  close() {
    this.Emitter.emit({ type: "quit" });
  }

  async set(a: string) {
    if(this.s[a] != this.settings[a]) {
      try {
        const result = await this.service
          .patch({ settingName: a, setTo: this.settings[a] }, "worker/settings/set", this.service.restaurant._id, this.workerId);
        result;
      } catch (e) {
        const error = e as HttpErrorResponse;
        console.log(error.status);
        if(error.status == 401) {
          
        }
      }
      this.s[a] = this.settings[a];
    }
  }

  ngOnInit() {
    this.s = JSON.parse(JSON.stringify(this.settings));
  }

}
