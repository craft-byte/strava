import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { IonicModule, ModalController, Platform, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import jsQR from 'jsqr';
import { CommonModule } from '@angular/common';



@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule]
})
export class TableComponent implements OnInit {

    canvasElement: any;
    videoElement: any;
    canvasContext: any;

    result: string = null!;


    ui = {
        showScan: false,
        showOther: true,
        showScanner: true,
    }

    constructor(
        private modalCtrl: ModalController,
        private plt: Platform,
        private loader: LoadService,
        private toastCtrl: ToastController,
    ) {
        const isInStandaloneMode = () =>
            'standalone' in window.navigator && window.navigator['standalone'];
        if (this.plt.is('ios') && isInStandaloneMode()) {
            this.ui.showOther = true;
            this.ui.showScanner = false;
        }
    };

    @ViewChild('video', { static: false }) video: ElementRef;
    @ViewChild('canvas', { static: false }) canvas: ElementRef;

    @Input() tables: any[];
    @Input() theme: string;
    @Input() table: string; /// chosen table

    cancel() {
        this.modalCtrl.dismiss();
    }

    select(t: any) {
        this.modalCtrl.dismiss(t.id);
    }


    async onScanned() {
        if (!this.result) {
            this.startScan();
            return;
        }


        try {
            // ex.    https://ctraba.com/doesn't-matter/what-matters-are-query-params?restaurantId=63000acd4ebc81862fb5354f&table=3&order=true
            const splitted = this.result.split("?");
            const query = splitted[1];  // result    --=  restaurantId=63000acd4ebc81862fb5354f&table=3&order=true  =--
            const queries = query.split("&");    // result    ['restaurantId=63000acd4ebc81862fb5354f', 'table=3', 'order=true']

            let table: number;
            let restaurantId: string;

            for (let i of queries) {
                const [name, value] = i.split("=");
                if (!name || !value) {
                    continue;
                }
                if (name == "restaurantId") {
                    if (value.length != 24) {
                        throw 'invalid';
                    }
                    restaurantId = value;
                } else if (name == "table") {
                    table = Number(value);
                    if (isNaN(table)) {
                        table = null!;
                        throw 'invalid';
                    }
                }
            }

            if (!restaurantId) {
                throw 'invalid';
            }

            this.modalCtrl.dismiss(table);
        } catch (e) {
            if (e == 'invalid') {
                (await this.toastCtrl.create({
                    duration: 2000,
                    color: "red",
                    message: "Scanned url is invalid",
                    mode: "ios",
                })).present();
            }
        }
    }


    async scan() {
        if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
            this.loader.end();
            this.ui.showScan = true;

            this.canvasElement.height = this.videoElement.videoHeight;
            this.canvasElement.width = this.videoElement.videoWidth;

            this.canvasContext.drawImage(
                this.videoElement,
                0,
                0,
                this.canvasElement.width,
                this.canvasElement.height
            );
            const imageData = this.canvasContext.getImageData(
                0,
                0,
                this.canvasElement.width,
                this.canvasElement.height
            );
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

            if (code) {
                this.ui.showScan = false;
                this.result = code.data;
                this.onScanned();
            } else {
                if (this.ui.showScan) {
                    requestAnimationFrame(this.scan.bind(this));
                }
            }
        } else {
            requestAnimationFrame(this.scan.bind(this));
        }
    }
    async startScan() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            this.videoElement.srcObject = stream;
            this.videoElement.setAttribute('playsinline', true);

            await this.loader.start();
            this.videoElement.play();
            requestAnimationFrame(this.scan.bind(this));
        } catch (error) {
            console.warn("No camera found");
            this.ui.showScanner = false;
            this.ui.showOther = true;
        }

    }

    async ngAfterViewInit() {
        this.canvasElement = this.canvas.nativeElement;
        this.canvasContext = this.canvasElement.getContext('2d');
        this.videoElement = this.video.nativeElement;

        this.startScan();
    }


    ngOnInit() {
    }

}
