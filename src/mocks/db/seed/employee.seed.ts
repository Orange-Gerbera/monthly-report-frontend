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

import type { EmployeeDto } from '../../../app/features/employees/models/employee.dto';
import { departmentStore } from '../department.store';

// UI用の従業員データ（EmployeeDto完全準拠）
export function seedEmployees(): EmployeeDto[] {

  const build = (
    code: string,
    lastName: string,
    firstName: string,
    email: string,
    role: string,
    departmentId: number
  ): EmployeeDto => {

    const dept = departmentStore.findById(departmentId);
    const parent = dept?.parentId
      ? departmentStore.findById(dept.parentId)
      : null;

    return {
      code,
      lastName,
      firstName,
      fullName: `${lastName} ${firstName}`,
      email,
      role,

      primaryDepartmentId: departmentId,

      departments: dept
        ? [
            ...(parent ? [{
              id: parent.id,
              name: parent.name,
              parentId: parent.parentId,
              primary: false,
              manager: true,
              level: 1
            }] : []),
            {
              id: dept.id,
              name: dept.name,
              parentId: dept.parentId,
              primary: true,
              manager: false,
              level: 2
            }
          ]
        : [],

      employmentStatus: 'EMPLOYED',
      active: true,
      enabled: true,
    };
  };

  return [
    build('1234', '田中', '太郎', 'taro@example.com', 'ADMIN', 1),
    build('9999', '管理', '次郎', 'kanri@example.com', 'ADMIN', 2),
    {
      ...build('5678', '山田', '花子', 'hanako@example.com', 'GENERAL', 3),
      enabled: false,
    },
  ];
}

// 認証（MSWの /api/auth/* 用）でだけ使う資格情報を分離
// EmployeeDtoにpasswordは含めない設計なので、別エクスポートにしておく
export type EmployeeCredential = {
  code: string;
  password: string;
};

export function seedEmployeeCredentials(): EmployeeCredential[] {
  return [
    { code: '1234', password: 'pass' },
    { code: '9999', password: 'pass' },
    { code: '5678', password: 'pass' },
  ];
}
