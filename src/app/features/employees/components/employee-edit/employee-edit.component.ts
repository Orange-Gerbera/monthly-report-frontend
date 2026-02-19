import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { DepartmentDto } from '../../../departments/models/department.dto';
import { EmployeeDto, EmployeeRequest } from '../../models/employee.dto';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { PasswordUtil } from '../../../../shared/utils/password.util';

@Component({
  selector: 'app-employee-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, IconComponent],
  templateUrl: './employee-edit.component.html',
})
export class EmployeeEditComponent implements OnInit {
  @Input() selfMode = false;
  @Input() noCard = false;
  isAdmin = false;
  private originalEmploymentStatus?: string;

  employee: EmployeeRequest = {
    code: '',
    lastName: '',
    firstName: '',
    email: '',
    role: 'GENERAL',
    departmentName: '',
    employmentStatus: 'EMPLOYED',
    active: true,
    password: '',
  };

  roleOptions = [
    { label: '一般', value: 'GENERAL' },
    { label: '管理者', value: 'ADMIN' },
  ];

  departments: DepartmentDto[] = [];

  passwordStrength = '';
  passwordStrengthClass = '';
  passwordScore = 0;

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
          this.originalEmploymentStatus = user.employmentStatus;
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
            this.originalEmploymentStatus = employee.employmentStatus;
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

  onEmailChange(): void {
    if (this.employee.password) {
      this.checkPasswordStrength(this.employee.password);
    }
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    // パスワード変更時のみチェック
    if (this.employee.password) {

      if (!PasswordUtil.isFormatValid(this.employee.password)) {
        alert('パスワード形式が正しくありません');
        return;
      }

      if (!PasswordUtil.isStrong(this.employee.password, this.employee.email)) {
        alert('パスワードが弱すぎます');
        return;
      }
    }

    // 雇用状態変更時のみ利用状態を連動
    if (this.employee.employmentStatus !== this.originalEmploymentStatus) {
      if (
        this.employee.employmentStatus === 'SUSPENDED' ||
        this.employee.employmentStatus === 'RETIRED'
      ) {
        this.employee.active = false;
      }

      if (this.employee.employmentStatus === 'EMPLOYED') {
        this.employee.active = true;
      }
    }

    const updateData: EmployeeRequest = {
      ...this.employee,
    };

    this.employeeService.update(this.employee.code, updateData).subscribe({
      next: () => {
        alert('従業員情報を更新しました');
        const redirectUrl = this.selfMode ? '/profile' : '/employees';
        this.router.navigate([redirectUrl]);
      },
      error: () => alert('更新に失敗しました'),
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
      this.passwordScore = 0;
      return;
    }

    if (!PasswordUtil.isFormatValid(password)) {
      this.passwordStrength = 'パスワード形式が正しくありません';
      this.passwordStrengthClass = 'text-danger';
      this.passwordScore = 0;
      return;
    }

    const result = PasswordUtil.getStrength(password, this.employee.email);
    this.passwordScore = result.score;

    if (result.score >= 3) {
      this.passwordStrength = '使用可能なパスワードです';
      this.passwordStrengthClass = 'text-success';
    } else {
      this.passwordStrength = 'パスワードが弱すぎます';
      this.passwordStrengthClass = 'text-danger';
    }
  }

  isPasswordInvalid(): boolean {
    if (!this.employee.password) return false;

    return !!this.employee.password && this.passwordScore < 3;
  }

  
  sanitizePassword(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = PasswordUtil.sanitize(input.value);

    input.value = sanitized;
    this.employee.password = sanitized;
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'EMPLOYED':
        return '在職';
      case 'SUSPENDED':
        return '休職';
      case 'RETIRED':
        return '退職';
      default:
        return status;
    }
  }

  employmentStatusOptions = [
    { label: '在職', value: 'EMPLOYED' },
    { label: '休職', value: 'SUSPENDED' },
    { label: '退職', value: 'RETIRED' },
  ];
}
