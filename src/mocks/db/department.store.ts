import type { DepartmentDto } from '../../app/features/departments/models/department.dto';
import { seedDepartments } from './seed/department.seed';

export class DepartmentStore {
  departments: DepartmentDto[] = [];
  /** 作成時の自動採番用 */
  private nextId = 1;

  constructor() {
    this.reset();
  }

  /** すべてを初期シード状態に戻す */
  reset() {
    this.departments = seedDepartments();
    const maxId = this.departments.length
      ? Math.max(...this.departments.map((d) => d.id))
      : 0;
    this.nextId = maxId + 1;
  }

  /** 一覧（防御的コピー） */
  list(): DepartmentDto[] {
    return this.departments.slice();
  }

  /** ID検索 */
  findById(id: number): DepartmentDto | null {
    return this.departments.find((d) => d.id === id) ?? null;
  }

  /** 名称重複チェック（厳密一致） */
  existsByName(name: string): boolean {
    const n = (name ?? '').trim();
    return this.departments.some((d) => d.name === n);
  }

  /** 追加（name必須） */
  create(partial: Partial<DepartmentDto>): DepartmentDto {
    const name = (partial.name ?? '').trim();
    if (!name) throw new Error('name is required');
    if (this.existsByName(name))
      throw new Error('Department name already exists');

    const created: DepartmentDto = {
      id: this.nextId++,
      name,
      active: true,
      hasEmployee: false,
       hasReport: false
    };
    this.departments.push(created);
    return created;
  }

  /** 削除（存在すれば true） */
  delete(id: number): boolean {
    const idx = this.departments.findIndex((d) => d.id === id);
    if (idx < 0) return false;
    this.departments.splice(idx, 1);
    return true;
  }
}

export const departmentStore = new DepartmentStore();
