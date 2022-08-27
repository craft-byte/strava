import { TestBed } from '@angular/core/testing';

import { KitchenSocketIdGuard } from './kitchen-socket-id.guard';

describe('KitchenSocketIdGuard', () => {
  let guard: KitchenSocketIdGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(KitchenSocketIdGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
