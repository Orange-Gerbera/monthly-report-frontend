import type { EmployeeDto } from '../../../app/features/employees/models/employee.dto';

// UI用の従業員データ（EmployeeDto完全準拠）
export function seedEmployees(): EmployeeDto[] {
  const build = (
    code: string,
    lastName: string,
    firstName: string,
    email: string,
    role: string,
    departmentName: string
  ): EmployeeDto => ({
    code,
    lastName,
    firstName,
    fullName: `${lastName} ${firstName}`,
    email,
    role, // 'ADMIN' | '管理者' | '一般' など、実装側の期待に合わせる
    departmentName,
    employmentStatus: 'EMPLOYED',
    active: true,
  });

  return [
    build('1234', '田中', '太郎', 'taro@example.com', 'ADMIN', '営業部'),
    build('9999', '管理', '次郎', 'kanri@example.com', '管理者', '総務部'),
    build('5678', '山田', '花子', 'hanako@example.com', '一般', '開発部'),
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
