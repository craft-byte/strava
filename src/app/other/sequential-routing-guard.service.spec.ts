import { TestBed } from '@angular/core/testing';

import { SequentialRoutingGuardService } from './sequential-routing-guard.service';

describe('SequentialRoutingGuardService', () => {
  let service: SequentialRoutingGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SequentialRoutingGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
