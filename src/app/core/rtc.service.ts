import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs'

@Injectable()
export class RtcService {

  private rtcDataSubject = new Subject<any>();
  private ws: WebSocket;
  private pc; //: RTCPeerConnection;

  constructor() { }

  connect(videoElement: HTMLVideoElement): Observable<any> {
    const wsurl = 'ws://192.168.2.179:80/webrtc';
    this.signal(wsurl,
      (stream) => {
        console.log('got a stream!');
        var url = window.URL
        videoElement.src = url ? url.createObjectURL(stream) : stream;
        videoElement.play();
      },
      (rtcDataChannel) => {
        this.rtcDataSubject.next(rtcDataChannel);
      },
      (error) => {
        console.warn(error);
      },
      () => {
        console.log('websocket closed. bye bye!');
        //TODO: src = ''
      },
      (message) => {
        console.info(message);
      }
    );
    return this.rtcDataSubject.asObservable();
  }

  close() {
    this.ws.close();
    this.ws = null;
    // pc closed in ws.onclose callback
  }

  signal(url, onStream, onDataChannel, onError, onClose, onMessage) {
    if ("WebSocket" in window) {
      console.log("opening web socket: " + url);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        /* First we create a peer connection */
        const config = { "iceServers": [{ "urls": ["stun:stun.l.google.com:19302"] }] };
        const options = { optional: [] };
        this.pc = new RTCPeerConnection(config);

        this.pc.onicecandidate = (event) => {
          if (event.candidate) {
            var candidate = {
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
              candidate: event.candidate.candidate
            };
            var request = {
              what: "addIceCandidate",
              data: JSON.stringify(candidate)
            };
            this.ws.send(JSON.stringify(request));
          } else {
            console.log("end of candidates.");
          }
        };

        this.pc.onaddstream = (event) => {
          onStream(event.stream);
        };

        this.pc.onremovestream = (event) => {
          console.log("the stream has been removed: do your stuff now");
        };

        this.pc.ondatachannel = (event) => {
          const rtcDataChannel = event.channel;
          //receiveChannel.onmessage = handleReceiveMessage;
          //receiveChannel.onopen = handleReceiveChannelStatusChange;
          //receiveChannel.onclose = handleReceiveChannelStatusChange;
          onDataChannel(rtcDataChannel);
          console.log("a data channel is available: do your stuff with it");
        };

        /* kindly signal the remote peer that we would like to initiate a call */
        var request = {
          what: "call",
          options: {
            force_hw_vcodec: false,
            vformat: 60 /* 640x480 */
          }
        };
        this.ws.send(JSON.stringify(request));
      };

      this.ws.onmessage = (evt) => {
        var msg = JSON.parse(evt.data);
        var what = msg.what;
        var data = msg.data;

        console.log("message =" + what);

        switch (what) {
          case "offer":
            var mediaConstraints = {
              optional: [],
              mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
              }
            };
            this.pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(data)),
              () => {
                this.pc.createAnswer( 
                (sessionDescription) => {
                  this.pc.setLocalDescription(sessionDescription);
                  var request = {
                    what: "answer",
                    data: JSON.stringify(sessionDescription)
                  };
                  this.ws.send(JSON.stringify(request));
                },
                (error) => {
                  onError("failed to create answer: " + error);
                }, mediaConstraints);
              },
              (event) => {
                onError('failed to set the remote description: ' + event);
                this.ws.close();
              }
            );

            var request = {
              what: "generateIceCandidates"
            };
            this.ws.send(JSON.stringify(request));
            break;

          case "answer":
            break;

          case "message":
            if (onMessage) {
              onMessage(msg.data);
            }
            break;

          case "iceCandidates":
            var candidates = JSON.parse(msg.data);
            for (var i = 0; candidates && i < candidates.length; i++) {
              var elt = candidates[i];
              let candidate = new RTCIceCandidate({ sdpMLineIndex: elt.sdpMLineIndex, candidate: elt.candidate });
              this.pc.addIceCandidate(candidate,
                () => {
                  console.log("IceCandidate added: " + JSON.stringify(candidate));
                },
                (error) => {
                  console.error("addIceCandidate error: " + error);
                }
              );
            }
            break;
        }
      };

      this.ws.onclose = (event) => {
        console.log('socket closed with code: ' + event.code);
        if (this.pc) {
          this.pc.close();
          this.pc = null;
        }
        if (onClose) {
          onClose();
        }
      };

      this.ws.onerror = function (event) {
        onError("An error has occurred on the websocket (make sure the address is correct)!");
      };

    } else {
      onError("Sorry, this browser does not support Web Sockets. Bye.");
    }
  }

}