import { TestBed } from '@angular/core/testing';

import { SecurityLockService } from './security-lock.service';

describe('SecurityLockService', () => {
  let service: SecurityLockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecurityLockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
