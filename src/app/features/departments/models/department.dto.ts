export interface DepartmentDto {
  id: number;
  name: string;
  parentId?: number;
  active: boolean;

  isProtected?: boolean;
  
  hasEmployee: boolean;
  hasReport: boolean;
}
