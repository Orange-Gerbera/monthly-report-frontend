/**
 * Project: Orange Gerbera
 * -----------------------------------------------------------------------------
 * Copyright (c) 2024-2026 Tai Naoyuki & Kagoshima Takuho.
 * All rights reserved.
 * 
 * This software and any associated documentation are the intellectual property
 * of Tai Naoyuki & Kagoshima Takuho.
 * 
 * Unauthorized copying, use, or distribution of this software,
 * in whole or in part, is strictly prohibited.
 * -----------------------------------------------------------------------------
 */

import { TestBed } from '@angular/core/testing';

import { ReportDueDateService } from './report-due-date.service';

describe('ReportDueDateService', () => {
  let service: ReportDueDateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportDueDateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
