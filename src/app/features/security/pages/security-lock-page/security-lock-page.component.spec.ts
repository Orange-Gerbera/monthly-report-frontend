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

import { SecurityLockPageComponent } from './security-lock-page.component';

describe('SecurityLockPageComponent', () => {
  let component: SecurityLockPageComponent;
  let fixture: ComponentFixture<SecurityLockPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityLockPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SecurityLockPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
