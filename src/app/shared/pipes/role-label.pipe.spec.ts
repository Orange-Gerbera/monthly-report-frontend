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

import { RoleLabelPipe } from './role-label.pipe';

describe('RoleLabelPipe', () => {
  it('create an instance', () => {
    const pipe = new RoleLabelPipe();
    expect(pipe).toBeTruthy();
  });
});
