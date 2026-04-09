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

import type { ReportDto } from '../../app/features/reports/models/report.dto';
import { seedReports } from './seed/report.seed';

class ReportStore {
  reports: ReportDto[] = [];

  constructor() {
    this.reset();
  }
  reset() {
    this.reports = seedReports();
  }
  nextId() {
    return this.reports.length
      ? Math.max(...this.reports.map((r) => r.id)) + 1
      : 1;
  }
}
export const reportStore = new ReportStore();
