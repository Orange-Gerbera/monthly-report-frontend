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

// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// ここで全ハンドラを登録。main.ts から worker.start(...) される想定。
export const worker = setupWorker(...handlers);
