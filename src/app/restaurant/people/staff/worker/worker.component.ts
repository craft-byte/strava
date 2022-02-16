import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RadminService } from 'src/app/restaurant/radmin.service';
import { getImage } from 'src/functions';
import { Worker } from 'src/models/radmin';
import { User } from 'src/models/user';

@Component({
  selector: 'app-worker',
  templateUrl: './worker.component.html',
  styleUrls: ['./worker.component.scss'],
})
export class WorkerComponent implements OnInit {

  user: User;

  image: string;
  name: string;

  constructor(
    private service: RadminService
  ) { };


  @Input() data: Worker;
  @Output() Emitter = new EventEmitter();

  more(btn: any) {
    this.Emitter.emit({ type: "more", data: {btn, user: this.data._id} });
  }

  async ngOnInit() {
    this.user = await this.service.get("user/get", this.data._id);
    if(this.user.avatar) {
      this.image = await getImage(this.user.avatar);
    }
    if(this.user.name) {
      this.name = this.user.name;
    } else {
      this.name = this.user.username;
    }
  }

}
