import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from '../restaurant.service';

@Component({
    selector: 'app-qr-codes',
    templateUrl: './qr-codes.page.html',
    styleUrls: ['./qr-codes.page.scss'],
})
export class QrCodesPage implements OnInit {

    restaurantName: string;
    adding = false;
    removing = false;

    data = {
        link: null,
        tables: [],
        persons: [],
        menuDownloadUrl: null,
    }

    constructor(
        private router: RouterService,
        private route: ActivatedRoute,
        private service: RestaurantService,
    ) { }



    back() {
        const last = this.route.snapshot.queryParamMap.get("last");

        if(last) {
            this.router.go([last]);
        } else {
            this.router.go(["restaurant", this.service.restaurantId, "settings"]);
        }
    }


    onTableQREmitted(e: any, id: number) {
        for(let i of this.data.tables) {
            if(i.index == id) {
                i.downloadUrl = e;
                break;
            }
        }
    }
    onMenuQREmitted(e: any) {
        this.data.menuDownloadUrl = e;
    }

    async add() {
        this.adding = true;

        const result: { updated: boolean; link?: string; index?: number; } = await this.service.post({}, "table");

        if(result.updated) {
            this.data.tables.push({
                link: result.link,
                index: result.index
            });
        }

        this.adding = false;
    }
    async remove() {
        this.removing = true;

        const result: any = await this.service.delete("table");

        if(result.updated) {
            this.data.tables.pop();
        }

        this.removing = false;
    }


    async ngOnInit() {
        this.restaurantName = this.service.restaurant.name.split(" ").join("_");

        const result: any = await this.service.get({}, "qr-codes");

        this.data = result;
    }

}
