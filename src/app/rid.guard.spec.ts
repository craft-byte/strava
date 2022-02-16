import { TestBed } from '@angular/core/testing';

import { RidGuard } from './rid.guard';

describe('RidGuard', () => {
  let guard: RidGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(RidGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
