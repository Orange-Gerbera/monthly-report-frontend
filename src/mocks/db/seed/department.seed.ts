import type { DepartmentDto } from '../../../app/features/departments/models/department.dto';

export function seedDepartments(): DepartmentDto[] {
  return [
    // 親
    { id: 19, name: '支社' },

    // 子（孫）
    { id: 20, name: '開発サービス課.', parentId: 19 },

    // 孫（ひ孫）
    { id: 21, name: '第１グループ', parentId: 20 },

    // 既存組織（全部ひ孫にぶら下げる）
    { id: 22, name: '開発チーム', parentId: 21 },
    { id: 23, name: '総合評価チーム', parentId: 21 },
    { id: 24, name: '保守運用チーム', parentId: 21 },
  ];
}