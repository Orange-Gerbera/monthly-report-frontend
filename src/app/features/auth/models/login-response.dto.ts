import { DepartmentResponse } from '../../employees/models/employee.dto';

export interface LoginResponse {
  token: string | null;
  code: string;
  name: string;
  role: string;
  email: string;
  departments: DepartmentResponse[];
  loginAt: string;
  passwordChangeRequired: boolean;
}
