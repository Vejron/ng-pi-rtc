import { TestBed, inject } from '@angular/core/testing';

import { RtcService } from './rtc.service';

describe('RtcService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RtcService]
    });
  });

  it('should be created', inject([RtcService], (service: RtcService) => {
    expect(service).toBeTruthy();
  }));
});
