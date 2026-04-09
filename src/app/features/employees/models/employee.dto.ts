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

export interface DepartmentResponse {
  id: number;
  name: string;
  parentId?: number;
  parentName?: string;
  primary: boolean;
  manager: boolean;
  level: number; //（孫=1, ひ孫=2）
}

export interface EmployeeDto {
  code: string;
  lastName: string;
  firstName: string;
  fullName: string;
  email: string;
  role: string;

  primaryDepartmentId?: number;
  departments: DepartmentResponse[];

  employmentStatus: string;
  active: boolean;
  enabled: boolean;
  locked?: boolean;
  lockUntil?: string;
}

 export interface EmployeeRequest {
  code: string;
  lastName: string;
  firstName: string;
  email: string;
  role: string;
  departmentId?: number | null; // ← これだけでいい
  employmentStatus: string;
  active: boolean;
  password?: string;
}