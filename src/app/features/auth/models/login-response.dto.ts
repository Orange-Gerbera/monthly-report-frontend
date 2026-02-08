export interface LoginResponse {
  token: string | null;
  code: string;
  name: string;
  role: string;
  email: string;
  department: string;
  loginAt: string;
  passwordChangeRequired: boolean;
}
