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

import { SelectComponent } from './select.component';

describe('SelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
