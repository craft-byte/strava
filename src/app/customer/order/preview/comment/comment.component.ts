import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  standalone: true,
  imports: [FormsModule, IonicModule]
})
export class CommentComponent implements OnInit, AfterViewInit {


  constructor() { };

  @Input() comment: string;
  @Output() done = new EventEmitter();

  @ViewChild("theTextarea") textarea: ElementRef;

  save() {
    this.done.emit(this.comment);
  }

  exit() {
    this.done.emit();
  }

  ngAfterViewInit(): void {
    this.textarea.nativeElement.focus();
  }
  ngOnInit() {}

}
