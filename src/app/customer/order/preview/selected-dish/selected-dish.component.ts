import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit, ChangeDetectorRef, Input, Output, EventEmitter, ViewChild, ViewContainerRef, NgZone } from '@angular/core';
import { SwipeEvent, SwipeModule } from 'ng-swipe';
import { CustomerService } from 'src/app/customer/customer.service';
import { OrderDish } from '../../other/models/order';
import { OrderService } from '../../order.service';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-selected-dish',
    templateUrl: './selected-dish.component.html',
    styleUrls: ['./selected-dish.component.scss'],
    standalone: true,
    imports: [CommonModule, SwipeModule, IonicModule],
    animations: [
        trigger("slideInOut", [
            transition(":enter", [
                style({
                    opacity: 0.3
                }),
                animate("500ms", style({
                    opacity: 1,
                }))
            ]),
            transition(":leave", [
                animate("400ms", style({
                    transform: "translateX(-1000px)",
                    opacity: 0
                })),
            ])
        ])
    ]
})
export class SelectedDishComponent implements OnInit {
    swipeDistance: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private order: OrderService,
        private service: CustomerService,
        private injector: Injector,
        private ngZone: NgZone
    ) { };


    @Input() dish: OrderDish;
    @Output() emitter = new EventEmitter();
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    @ViewChild("dishModalContainer", { read: ViewContainerRef }) dishModalContainer: ViewContainerRef;


    onSwipeMove(e: SwipeEvent) {
        if(e.direction == "x" && e.distance < 100 && e.distance > -100) {
            this.swipeDistance = e.distance;
            this.changeDetector.detectChanges();
        }
    }
    onSwipeEnd(_e: SwipeEvent) {
        if(this.swipeDistance) {
            // swiped to the left
            if(this.swipeDistance < -90) {
                
                this.remove();

            }
            // swiper to the right
            else if(this.swipeDistance > 90) {

                this.goDish();

            }
        }

        this.swipeDistance = 0;
        this.changeDetector.detectChanges();
    }

    async remove() {
        try {
            const result: any = await this.service.delete({}, "order", this.service.restaurantId, "session", "dish", this.dish._id);

            if(!result.updated) {
                return;
            }

            for(let i in this.order.dishes) {
                if(this.order.dishes[i]._id == this.dish._id) {
                    this.order.dishes.splice(+i, 1);
                    this.emitter.emit("removed");
                    break;
                }
            }

        } catch (e) {
            console.error(e);
        }
    }

    async more() {
        const { OrderDishInfoComponent } = await import("./../order-dish-info/order-dish-info.component");

        const component = this.modalContainer.createComponent(OrderDishInfoComponent);

        component.instance.dish = this.dish;

        component.instance.leave.subscribe((action: "remove" | "fulldish") => {
            if(action == "remove") {
                this.remove();
            } else if(action == "fulldish") {
                this.goDish();
            }

            component.destroy(); 
        });
    }

    goDish() {
        this.ngZone.run(async () => { 
            const { DishModalComponent } = await import("./../../dishes/dish-modal/dish-modal.component");
            
            const component = this.modalContainer.createComponent(DishModalComponent, { injector: this.injector });
    
    
            component.instance.dishId = this.dish.dishId;
            
    
            component.instance.leave.subscribe(() => {
                component.destroy();
            });
        })
    }

    ngOnInit() { }

}
