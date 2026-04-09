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

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportEditComponent } from './report-edit.component';

describe('ReportEditComponent', () => {
  let component: ReportEditComponent;
  let fixture: ComponentFixture<ReportEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReportEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
