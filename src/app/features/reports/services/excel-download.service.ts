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

import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ExcelDownloadService {
  download(
    response: HttpResponse<Blob>,
    defaultFilename: string = 'report.xlsx'
  ): void {
    const blob = response.body!;
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename =
      this.extractFilename(contentDisposition) || defaultFilename;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private extractFilename(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;

    const utf8FilenameRegex = /filename\*=UTF-8''(.+?)(?:;|$)/i;
    const fallbackFilenameRegex = /filename="(.+?)"/i;

    const utf8Match = utf8FilenameRegex.exec(contentDisposition);
    if (utf8Match && utf8Match[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const fallbackMatch = fallbackFilenameRegex.exec(contentDisposition);
    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1];
    }

    return null;
  }
}
