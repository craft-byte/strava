import { TestBed } from '@angular/core/testing';

import { DishGuard } from './dish.guard';

describe('DishGuard', () => {
  let guard: DishGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(DishGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
