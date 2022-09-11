import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Injector, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { CustomerService } from 'src/app/customer/customer.service';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { OrderService } from '../../order.service';

@Component({
  selector: 'app-ordered-dish',
  templateUrl: './dish.component.html',
  imports: [CommonModule, IonicModule],
  standalone: true,
  styleUrls: ['./dish.component.scss'],
  animations: [
    trigger('showUp', [
      transition(':enter', [
        group([
          style({ background: "rgb(0,0,0,0)" }),
          animate('200ms ease-in', style({ background: "rgb(0,0,0,0.5)" })),
          query(".body", [
            style({ transform: 'scale(0.7)', opacity: "0" }),
            animate("200ms ease-in", style({ transform: 'scale(1)', opacity: "1", })),
          ])
        ])
      ]),
      transition(':leave', [
        group([
          animate("200ms ease-in", style({ background: "rgb(0,0,0,0.0)" })),
          query(".body", [
            animate('200ms ease-in', style({ transform: 'scale(0.75)', opacity: "0" })),
          ])
        ])
      ])
    ]),
  ]
})
export class DishComponent implements OnInit {

  image: string;
  dish: any;
  dishes: any;
  show = true;

  constructor(
    private order: OrderService,
    private service: CustomerService,
    private router: RouterService,
    private loader: LoadService,
    private toastCtrl: ToastController,
    private injector: Injector,
  ) { };

  @ViewChild("commentModalContainer", { read: ViewContainerRef }) commentModal: ViewContainerRef;

  @Input() dishId: string;
  @Output() leave = new EventEmitter();

  close() {
    this.show = false;
    this.leave.emit();
  }

  fullDish() {
    this.router.go(["customer", "order", this.service.restaurantId, "dish", this.dish._id]);
    
    this.show = false;
    this.leave.emit(true);
  }

  async remove(id: string) {
    let component: any;
    let index: any;
    for(let i in this.dishes) {
      if(this.dishes[i]._id == id) {
        index = i;
        component = this.dishes.splice(+i, 1);
        break;
      }
    }

    const result: any = await this.service.delete({}, "order", this.service.restaurantId, "session", "dish", id);

    if(!result.updated) {
      this.dishes.splice(+index, 0, component[0]);
      (await this.toastCtrl.create({
        duration: 1500,
        color: "red",
        message: "Something went wrong. Please try again",
        mode: "ios",
      })).present();
    } else {
      for(let i in this.order.dishes) {
        if(this.order.dishes[i]._id == component[0].dishId) {
          this.order.dishes[i].quantity--;
          if(this.order.dishes[i].quantity == 0) {
            this.order.dishes.splice(+i, 1);
            this.close();
          }
          break;
        }
      }
    }
    
  }

  async addComment(id: string, c: string) {
    const { CommentComponent } = await import("./comment/comment.component");

    const component = this.commentModal.createComponent(CommentComponent, { injector: this.injector });

    component.instance.comment = c;

    component.instance.done.subscribe(comment => {
      component.destroy();
      this.setComment(id, comment);
    })

  }
  async setComment(id: string, comment: string) {
    let index: string;
    for(let i in this.dishes) {
      if(this.dishes[i]._id == id) {
        index = i;
        this.dishes[i].comment = comment;
        break;
      }
    }

    const result: any = await this.service.post({ comment, }, "order", this.service.restaurantId, "session", "dish", id, "comment");

    if(!result.updated) {
      this.dishes[index].comment = null;
      (await this.toastCtrl.create({
        duration: 1500,
        color: "red",
        message: "Something went wrong. Please try again",
        mode: "ios",
      })).present();
    }
  }

  async ngOnInit() {
    await this.loader.start();
    for(let i of this.order.dishes) {
      if(i._id == this.dishId) {
        this.dish = i;
        break;
      }
    }

    const result = await this.service.get({}, "order", this.service.restaurantId, "session", "dish", this.dish._id);

    this.dishes = result;

    this.loader.end();
  }

}
