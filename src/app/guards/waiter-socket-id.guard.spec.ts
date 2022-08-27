import { TestBed } from '@angular/core/testing';

import { WaiterSocketIdGuard } from './waiter-socket-id.guard';

describe('WaiterSocketIdGuard', () => {
  let guard: WaiterSocketIdGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(WaiterSocketIdGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
