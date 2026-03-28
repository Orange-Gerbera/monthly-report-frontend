export interface DepartmentDto {
  id: number;
  name: string;
  parentId?: number;
  active: boolean;

  hasEmployee: boolean;
  hasReport: boolean;
}
