import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RadminService } from 'src/app/restaurant/radmin.service';

@Component({
  selector: 'app-invitings-window',
  templateUrl: './invitings-window.component.html',
  styleUrls: ['./invitings-window.component.scss'],
})
export class InvitingsWindowComponent implements OnInit {


  invitings: any[];

  constructor(
    private service: RadminService
  ) { };


  @Input() restaurant: string;
  @Output() Emitter = new EventEmitter();

  quit() {
    this.Emitter.emit({ type: "quit" });
  }


  async remove(invitationId: string, userId: string) {
    const result = await this.service.delete<{acknowledged: boolean}>("invitation/remove", this.restaurant, userId, invitationId);

    if(result.acknowledged) {
      for(let i in this.invitings) {
        if(this.invitings[i]._id == invitationId) {
          this.invitings.splice(+i, 1);
          return;
        }
      }
    }
  }



  async ngOnInit() {
    this.invitings = await this.service.get("invitings/get", this.restaurant); 
  }

}
