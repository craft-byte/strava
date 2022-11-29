import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertController, ModalController, Platform, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import jsQR from 'jsqr';
import { CustomerService } from '../customer.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-scan',
    templateUrl: './scan.page.html',
    styleUrls: ['./scan.page.scss'],
})
export class ScanPage implements OnInit, OnDestroy {

    restaurants: any;

    canvasElement: any;
    videoElement: any;
    canvasContext: any;

    stream: MediaStream;

    result: string = null!;

    ui = {
        showScan: false,
        showOther: true,
        showScanner: true,
    }


    constructor(
        private router: RouterService,
        private loader: LoadService,
        private service: CustomerService,
        private plt: Platform,
        private alertCtrl: AlertController,
        private toastCtrl: ToastController,
        private route: ActivatedRoute,
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




    back() {
        this.router.go(["user/info"]);
        this.stopRecording();
    }

    
    selectRestaurant(id: string) {
        this.router.go(["customer", "order", id]);
        this.stopRecording();
    }
    async confirmTable() {
        const alert = await this.alertCtrl.create({
            header: "Oops...",
            message: "Seems like someone is on the table, do you want to continue?",
            mode: "ios",
            buttons: [
                {
                    text: "Cancel",
                },
                {
                    text: "Continue",
                    role: "continue"
                }
            ]
        });
        await alert.present();

        const { role } = await alert.onDidDismiss();

        if (role == "continue") {
            return true;
        }
        return false;
    }
    async redirect(restaurantId: string, table: number, order: boolean) {
        this.router.go(["customer", "order", restaurantId], { queryParams: { table: table } });
    }


    //
    //    WHEN QR CODE SCANNED
    //
    //    if url has table order created with table
    //    if url has order=true query order created with type='out'
    //
    async onScanned() {
        if (!this.result) {
            this.startScan();
            return;
        }


        this.stopRecording();


        try {

            // ex.    https://stravamenu.com/doesnt-matter/at-all/{{ restaurantId }}?table=2
            const splitted = this.result.split("?");
            const query = splitted[1];  // result    --=  table=2&someother=staff  =--
            const queries = query.split("&");    // result    ['notUsedParam=notused', 'table=3', 'somethignelse=false']

            let restaurantId = splitted[0].split("/")[splitted[0].split("/").length - 1];

            if(restaurantId.length != 24) {
                throw "restaurantId";
            }

            let table: number;
            let order: boolean = false;

            for (let i of queries) {
                const [name, value] = i.split("=");
                if (!name || !value) {
                    continue;
                } else if (name == "table") {
                    table = Number(value);
                    if (isNaN(table)) {
                        table = null!;
                    }
                } else if (name == "order") {
                    if (value == "true") {
                        order = true;
                    } else if (value == "false") {
                        order = false;
                    }
                }
            }

            if (!restaurantId) {
                const try2 = splitted[0].split("/")[splitted[0].split("/").length - 1];
                if(try2.length == 24) {
                    restaurantId = try2;
                } else {
                    throw 'restaurantId';
                }
            }

            this.redirect(restaurantId, table, order);
        } catch (e) {
            if (e == 'restaurantId') {
                (await this.toastCtrl.create({
                    duration: 2000,
                    color: "red",
                    message: "Scanned url is invalid",
                    mode: "ios",
                })).present();
                this.startScan();
            }
        }
    }


    stopRecording() {
        if(this.stream) {
            this.stream.getVideoTracks().forEach(t => t.stop());
        }
    }

    //
    //    SCAN
    //
    async scan() {
        if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
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
                // (this.videoElement as HTMLVideoElement).remove();
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
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });


            this.videoElement.srcObject = this.stream;
            this.videoElement.setAttribute('playsinline', true);

            this.videoElement.play();
            requestAnimationFrame(this.scan.bind(this));
        } catch (error) {
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
    async ngOnInit() {
        await this.loader.start();
        const restaurantId = this.route.snapshot.queryParamMap.get("restaurantId");
        const table = this.route.snapshot.queryParamMap.get("table");


        this.restaurants = await this.service.get({}, "restaurants");

        this.loader.end();
    }
    ngOnDestroy(): void {
        this.stopRecording();
    }
    ionViewDidEnter() {
        if(!this.stream || !this.stream.active) {
            this.startScan();
        }
    }
    ionViewDidLeave() {
        this.stopRecording();
    }
}
