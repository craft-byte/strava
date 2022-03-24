import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Worker } from 'src/models/radmin';
import { ConvertedFeedback, User } from 'src/models/user';
import { RadminService } from '../../radmin.service';

@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  styleUrls: ['./window.component.scss'],
})
export class WindowComponent implements OnInit {

  found = [];
  searchText: string = null;
  user: User = null;
  stage: "then" | "searching" | "inviting" = "searching";

  newWorker: Worker = {
    role: "cook"
  };

  ui = {
    searchTitle: "Search"
  }

  settings = {
    dishes: true,
    removingDishes: false,
    editingComponents: true,
    staff: false,
    staffRemoving: false
  }

  feedbacks: ConvertedFeedback[];

  constructor(
    private service: RadminService
  ) { };

  @Input() type: "add" | "remove";
  @Input() restaurant: string;
  @Output() Emitter = new EventEmitter();


  async find() {
    if(!this.searchText || this.searchText.length == 0) {
      return;
    }
    const result = await this.service.patch<Array<any>>({ text: this.searchText }, "users/all");
    this.found = result;
  }

  quit() {
    this.Emitter.emit({type: "quit"});
  }
  toSearching() {
    this.user = null;
    this.stage = "searching";
  }
  async add(user: any) {
    this.user = user;
    this.feedbacks = await this.service.get("feedbacks", user._id);
    this.stage = "then";
  }
  invite() {
    this.stage = "inviting";
  }

  async submit() {
    const newWorker = this.newWorker;

    if(newWorker.role == "manager") {
      newWorker.settings = this.settings;
    }


    const result = await this.service.post<
      { error?: string; acknowledged: boolean; newWorker?: Worker }
    >({ newWorker }, "worker/add", this.restaurant, this.user._id);

    if(!result.acknowledged) {
      if(result.error == "user") {
        this.stage = "searching";
        this.ui.searchTitle = "User works already";
      }
      return;
    }


    this.Emitter.emit({ type: "added" })
  }

  ngOnInit() {
    console.log(this.type);
  }

}
