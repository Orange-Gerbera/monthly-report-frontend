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

import { Component } from '@angular/core';
import { EmployeeEditComponent } from '../../components/employee-edit/employee-edit.component';
import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({
  selector: 'app-employee-edit-page',
  standalone: true,
  imports: [EmployeeEditComponent, IconComponent],
  templateUrl: './employee-edit-page.component.html'
})
export class EmployeeEditPageComponent {

}
