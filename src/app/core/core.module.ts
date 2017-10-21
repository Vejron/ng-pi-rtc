import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RtcService } from './rtc.service'

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [],
  declarations: [],
  providers: [ RtcService ]
})
export class CoreModule { }
