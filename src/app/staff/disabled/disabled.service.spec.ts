import { TestBed } from '@angular/core/testing';

import { SoloService } from './disabled.service';

describe('SoloService', () => {
  let service: SoloService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoloService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
