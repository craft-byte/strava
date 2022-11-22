import { TestBed } from '@angular/core/testing';

import { SocketGuardForDisabled } from './socket-for-disabled.guard';

describe('SocketGuard', () => {
  let guard: SocketGuardForDisabled;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SocketGuardForDisabled);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
