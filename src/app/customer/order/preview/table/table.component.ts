import { Component, ElementRef, Input, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
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

    stream: MediaStream;

    ui = {
        showScan: false,
        showOther: true,
        showScanner: true,
    }

    constructor(
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


    @Output() leave = new EventEmitter();

    close() {
        this.stopRecording();
        this.leave.emit();
    }

    async onScanned() {
        if (!this.result) {
            this.startScan();
            return;
        }


        try {
            // ex.    https://ctraba.com/doesn't-matter/what-matters-are-query-params/{{ restaurantId }}?table=3&order=true
            
            const splitted = this.result.split("?");
            const query = splitted[1];  // result    --=  table=2&someother=staff  =--
            const queries = query.split("&");    // result    ['notUsedParam=notused', 'table=3', 'somethignelse=false']

            let table: number;
            let restaurantId: string = splitted[0].split("/")[splitted[0].split("/").length - 1];;

            for (let i of queries) {
                const [name, value] = i.split("=");
                if (!name || !value) {
                    continue;
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

            this.leave.emit(table);
            this.stopRecording();
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
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            this.videoElement.srcObject = this.stream;
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

    stopRecording() {
        if(this.stream) {
            this.stream.getVideoTracks().forEach(t => t.stop());
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
