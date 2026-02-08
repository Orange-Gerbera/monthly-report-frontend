export interface EmployeeDto {
  code: string;
  lastName: string;
  firstName: string;
  fullName: string;
  email: string;
  role: string;
  departmentName: string;
  locked?: boolean;
  lockUntil?: string; 
}

export type EmployeeRequest = Omit<EmployeeDto, 'fullName' | 'locked' | 'lockUntil'> & {
  password?: string;
};
