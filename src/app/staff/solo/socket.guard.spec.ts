import { TestBed } from '@angular/core/testing';

import { SocketGuard } from './socket.guard';

describe('SocketGuard', () => {
  let guard: SocketGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SocketGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
