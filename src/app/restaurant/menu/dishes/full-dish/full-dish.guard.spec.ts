import { TestBed } from '@angular/core/testing';

import { FullDishGuard } from './full-dish.guard';

describe('FullDishGuard', () => {
  let guard: FullDishGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(FullDishGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
