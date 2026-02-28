export interface EmployeeDto {
  code: string;
  lastName: string;
  firstName: string;
  fullName: string;
  email: string;
  role: string;
  departmentName: string;
  employmentStatus: string;
  active: boolean;
  enabled: boolean;
  locked?: boolean;
  lockUntil?: string; 
}

export type EmployeeRequest = Omit<
  EmployeeDto,
  'fullName' | 'locked' | 'lockUntil' | 'enabled'
> & {
  password?: string;
};