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

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'employmentStatusLabel',
  standalone: true
})
export class EmploymentStatusLabelPipe implements PipeTransform {

  transform(status: string): string {

    switch (status) {
      case 'EMPLOYED':
        return '在職';
      case 'SUSPENDED':
        return '休職';
      case 'RETIRED':
        return '退職';
      default:
        return status;
    }

  }

}