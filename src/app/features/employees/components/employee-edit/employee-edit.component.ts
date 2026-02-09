import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { DepartmentDto } from '../../../departments/models/department.dto';
import { EmployeeDto, EmployeeRequest } from '../../models/employee.dto';

@Component({
  selector: 'app-employee-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-edit.component.html',
})
export class EmployeeEditComponent implements OnInit {
  @Input() selfMode = false;
  isAdmin = false;

  employee: EmployeeRequest = {
    code: '',
    lastName: '',
    firstName: '',
    email: '',
    role: 'GENERAL',
    departmentName: '',
    password: '',
  };

  roleOptions = [
    { label: '一般', value: 'GENERAL' },
    { label: '管理者', value: 'ADMIN' },
  ];

  departments: DepartmentDto[] = [];

  passwordStrength = '';
  passwordStrengthClass = '';

  showPassword = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.fetchDepartments();

    if (this.selfMode) {
      this.employeeService.getCurrentUser().subscribe({
        next: (user) => {
          this.employee = {
            ...user,
            role: this.convertRoleToEnum(user.role),
            password: '',
          };
          this.isAdmin = this.employee.role === 'ADMIN';
          console.log(
            '取得したrole:',
            user.role,
            '変換後:',
            this.employee.role
          );
        },

        error: (err) =>
          console.error('ログインユーザー情報の取得に失敗しました', err),
      });
    } else {
      const code = this.route.snapshot.paramMap.get('code');
      if (code) {
        this.employeeService.getEmployeeByIdWithFallback(code).subscribe({
          next: (employee) => {
            this.employee = {
              ...employee,
              role: this.convertRoleToEnum(employee.role),
              password: '',
            };
          },

          error: (err) =>
            console.error('従業員データの取得に失敗しました', err),
        });
      }
    }
  }

  fetchDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: (data) => (this.departments = data),
      error: (err) => console.error('所属一覧の取得に失敗しました', err),
    });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const updateData: EmployeeRequest = {
      ...this.employee,
    };
    console.log('送信データ:', updateData);

    this.employeeService.update(this.employee.code, updateData).subscribe({
      next: () => {
        alert('従業員情報を更新しました');
        const redirectUrl = this.selfMode ? '/profile' : '/employees';
        this.router.navigate([redirectUrl]);
      },
      error: (err) => {
        console.error('更新に失敗しました', err);
        alert('更新に失敗しました');
      },
    });
  }

  private convertRoleToEnum(role: string): 'GENERAL' | 'ADMIN' {
    if (role === 'ADMIN' || role === 'GENERAL')
      return role as 'GENERAL' | 'ADMIN';
    return role === '管理者' ? 'ADMIN' : 'GENERAL';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  checkPasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = '';
      this.passwordStrengthClass = '';
      return;
    }

    if (!this.isPasswordInvalid(password)) {
      this.passwordStrength = '使用可能なパスワードです';
      this.passwordStrengthClass = 'text-success';
    } else {
      this.passwordStrength = '';
      this.passwordStrengthClass = '';
    }
  }

  isPasswordInvalid(password?: string): boolean {
    const p = password ?? this.employee.password;

    if (!p) return false; // 未入力＝変更なしOK

    const lengthOk = p.length >= 9 && p.length <= 16;
    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasNumber = /\d/.test(p);
    const hasSymbol = /[\^$+\-*/|()\[\]{}<>.,?!_=&@~%#:;'"]/.test(p);
    const hasSpace = /\s/.test(p);

    return !(lengthOk && hasUpper && hasLower && hasNumber && hasSymbol && !hasSpace);
  }

  sanitizePassword(event: any): void {
    const value = event.target.value;

    // 全角・日本語を除去（ASCIIのみ許可）
    const sanitized = value.replace(/[^\x20-\x7E]/g, '');

    event.target.value = sanitized;
    this.employee.password = sanitized;
  }
}
