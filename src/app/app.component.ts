import { Component, ViewChild } from '@angular/core';
import { RtcService } from './core/rtc.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('videoPlayer') videoPlayer: any;

  title = 'app';
  videoSource = '';
  rtcDataChannel;
  rtcDataChannelOpen = false;

  constructor(private rtcSrevice: RtcService) { }

  connect() {
    this.rtcSrevice.connect(this.videoPlayer.nativeElement).subscribe(
      (rtcDataChannel) => {
        this.rtcDataChannel = rtcDataChannel;
        rtcDataChannel.onmessage = (event) => {
          console.log('data recived: ' + event.data);
        };
        rtcDataChannel.onopen = () => {
          console.info('datachannel open');
          this.rtcDataChannelOpen = true;
        };
        rtcDataChannel.onclose = () => {
          console.info('datachannel closed');
          this.rtcDataChannelOpen = false;
        }
      }
    );
  }

  disConnect() {
    this.rtcDataChannel.close();
    this.rtcSrevice.close();
  }

  sendData(data) {
    if(this.rtcDataChannelOpen) {
      this.rtcDataChannel.send(data);
    }
  }
}



