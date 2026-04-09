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

import { authHandlers } from './auth';
import departmentHandlers from './department';
import employeeHandlers from './employee';
import { reportHandlers } from './report';

export const handlers = [
  ...authHandlers,
  ...reportHandlers,
  ...employeeHandlers,
  ...departmentHandlers,
];
