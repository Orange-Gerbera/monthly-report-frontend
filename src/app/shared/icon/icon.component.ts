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

import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideAngularModule, NgIf],
  template: `
    <lucide-icon
      *ngIf="name"
      [name]="name"
      class="app-icon">
    </lucide-icon>
  `,
  styleUrls: ['./icon.component.scss']
})
export class IconComponent {

  @Input() name!: string;

}