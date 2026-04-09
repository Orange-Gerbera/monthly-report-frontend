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

import type { DepartmentDto } from '../../../app/features/departments/models/department.dto';

export function seedDepartments(): DepartmentDto[] {
  return [
    // 親
    { id: 19, name: '支社', active: true, hasEmployee: false, hasReport: false },

    // 子
    { id: 20, name: '開発サービス課.', parentId: 19, active: true, hasEmployee: true, hasReport: true },

    // 孫
    { id: 21, name: '第１グループ', parentId: 20, active: true, hasEmployee: true, hasReport: false },

    // 既存組織
    { id: 22, name: '開発チーム', parentId: 21, active: true, hasEmployee: false, hasReport: false },
    { id: 23, name: '総合評価チーム', parentId: 21, active: true, hasEmployee: false, hasReport: false },
    { id: 24, name: '保守運用チーム', parentId: 21, active: true, hasEmployee: true, hasReport: true },
  ];
}