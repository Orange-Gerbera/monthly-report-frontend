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

import { DueDateListComponent } from './due-date-list.component';

describe('DueDateListComponent', () => {
  let component: DueDateListComponent;
  let fixture: ComponentFixture<DueDateListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DueDateListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DueDateListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
