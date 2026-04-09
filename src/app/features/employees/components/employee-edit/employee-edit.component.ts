/**
 * Project: Orange Gerbera
 * -----------------------------------------------------------------------------
 * Copyright (c) 2024-2026 Tai Naoyuki & Kagoshima Takuho.
 * All rights reserved.
 * 
 * This software and any associated documentation are the intellectual property
 * of Tai Naoyuki & Kagoshima Takuho.
 * 
 * Unauthorized copying, use, or distribution of this software,
 * in whole or in part, is strictly prohibited.
 * -----------------------------------------------------------------------------
 */

import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { DepartmentDto } from '../../../departments/models/department.dto';
import { EmployeeRequest } from '../../models/employee.dto';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { PasswordUtil } from '../../../../shared/utils/password.util';
import { ContextService } from '../../../../shared/services/context.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-employee-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, IconComponent],
  templateUrl: './employee-edit.component.html',
  styleUrls: ['./employee-edit.component.scss']
})
export class EmployeeEditComponent implements OnInit, OnDestroy {
  @Input() selfMode = false;
  @Input() noCard = false;
  isSystemAdmin = false;

  private originalRole?: string;
  private originalEmploymentStatus?: string;

  employee: EmployeeRequest = {
    code: '',
    lastName: '',
    firstName: '',
    email: '',
    role: 'GENERAL',
    departmentId: undefined as any,
    employmentStatus: 'EMPLOYED',
    active: true,
    password: '',
  };

  roleOptions = [
    { label: '一般', value: 'GENERAL' },
    { label: '管理者', value: 'ADMIN' },
    { label: 'システム管理者', value: 'SYSTEM_ADMIN' },
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
    private departmentService: DepartmentService,
    private context: ContextService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // =========================
    // ★ 追加：画面に入った時にロックをかける
    // =========================
    this.context.setLocked(true);

    this.employeeService.getCurrentUser().subscribe(user => {
      this.isSystemAdmin = user.role === 'SYSTEM_ADMIN';

      // 👇 ユーザー確定後に部署取得
      this.fetchDepartments();

      this.context.selectedDeptId$.subscribe(() => {
        this.setDefaultDepartment();
      });

      if (this.selfMode) {
        this.employee = {
          code: user.code,
          lastName: user.lastName,
          firstName: user.firstName,
          email: user.email,
          role: this.convertRoleToEnum(user.role),
          departmentId: user.primaryDepartmentId,
          employmentStatus: user.employmentStatus,
          active: user.active,
          password: '',
        };

        this.originalRole = user.role;
        this.originalEmploymentStatus = user.employmentStatus;
        this.setDefaultDepartment();
      } else {
        const code = this.route.snapshot.paramMap.get('code');
        if (code) {
          this.employeeService.getEmployeeByIdWithFallback(code).subscribe({
            next: (employee) => {
              this.employee = {
                code: employee.code,
                lastName: employee.lastName,
                firstName: employee.firstName,
                email: employee.email,
                role: this.convertRoleToEnum(employee.role),
                departmentId: employee.primaryDepartmentId,
                employmentStatus: employee.employmentStatus,
                active: employee.active,
                password: '',
              };

              this.originalRole = employee.role;
              this.originalEmploymentStatus = employee.employmentStatus;

              this.setDefaultDepartment();
            },
            error: (err) =>
              console.error('従業員データの取得に失敗しました', err),
          });
        }
      }
    });
  }

  // =========================
  // ★ 追加：画面を離れる時にロックを解除する
  // =========================
  ngOnDestroy(): void {
    this.context.setLocked(false);
  }

  onRoleChange(): void {

    if (this.originalRole === 'SYSTEM_ADMIN') {
      this.employee.role = 'SYSTEM_ADMIN';
      return;
    }

    if (this.employee.password) {
      this.checkPasswordStrength(this.employee.password);
    }
  }

  fetchDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: (data) => {
        this.departments = data;
        this.setDefaultDepartment();
      },
      error: (err) => console.error('所属一覧の取得に失敗しました', err),
    });
  }

  get filteredRoleOptions() {
    if (this.isSystemAdmin) {
      return this.roleOptions;
    }
    return this.roleOptions.filter(
      r => r.value !== 'SYSTEM_ADMIN'
    );
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

     if (!this.employee.departmentId) {
        alert('所属を選択してください');
        return;
      }

    // 役職変更時にパスワード強度を再確認
    if (this.employee.role !== this.originalRole && this.employee.password) {
      const requiredScore = this.getRequiredScore();
      if (!PasswordUtil.isStrong(this.employee.password, this.employee.email, requiredScore)) {
        alert(
          this.isAdmin
            ? '管理者用のパスワードとしては強度が足りません'
            : 'パスワードが弱すぎます'
        );
        return;
      }
    }

    // パスワード変更時のみチェック
    if (this.employee.password) {

      if (!PasswordUtil.isFormatValid(this.employee.password)) {
        alert('パスワード形式が正しくありません');
        return;
      }

      const requiredScore = this.getRequiredScore();
      if (!PasswordUtil.isStrong(
            this.employee.password,
            this.employee.email,
            requiredScore
      )) {
        alert(
          this.isAdmin
            ? '管理者用のパスワードとしては強度が足りません'
            : 'パスワードが弱すぎます'
        );
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

    if (!updateData.password) {
      delete updateData.password;
    }

    this.employeeService.update(this.employee.code, updateData).subscribe({
      next: () => {
        alert('従業員情報を更新しました');
        const redirectUrl = this.selfMode ? '/profile' : '/employees';
        this.router.navigate([redirectUrl]);
        this.authService.refreshCurrentUser();
      },
      error: (err) => 
        alert('保存に失敗しました: ' + (err.error?.message || err.statusText)),
    });
  }

  private getRequiredScore(): number {
    if (this.isAdmin) return 4;
    return 3;
  }

  private convertRoleToEnum(role: string): 'GENERAL' | 'ADMIN' | 'SYSTEM_ADMIN' {
    if (role === 'SYSTEM_ADMIN' || role === 'ADMIN' || role === 'GENERAL') {
      return role as 'GENERAL' | 'ADMIN' | 'SYSTEM_ADMIN';
    }

    if (role === 'システム管理者') return 'SYSTEM_ADMIN';
    if (role === '管理者') return 'ADMIN';

    return 'GENERAL';
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

    const requiredScore = this.getRequiredScore();
    if (result.score >= requiredScore) {
      this.passwordStrength =
        this.isAdmin
          ? '管理者用として使用可能なパスワードです'
          : '使用可能なパスワードです';
      this.passwordStrengthClass = 'text-success';
    } else {
      this.passwordStrength =
        this.isAdmin
          ? '管理者用のパスワードとしては強度が足りません'
          : 'パスワードが弱すぎます';
      this.passwordStrengthClass = 'text-danger';
    }
  }

  isPasswordInvalid(): boolean {
    if (!this.employee.password) return false;
    const requiredScore = this.getRequiredScore();
    return (
      !PasswordUtil.isFormatValid(this.employee.password) ||
      this.passwordScore < requiredScore
    );
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

  get selectableDepartments(): DepartmentDto[] {
    const parentId = this.context.getDeptId();

    if (!parentId) return [];

    let list = this.departments.filter(d =>
      Number(d.parentId) === Number(parentId) &&
      d.id !== 1 &&
      d.active
    );

    if (this.isSystemAdmin && this.employee.role === 'SYSTEM_ADMIN') {
      const none = this.departments.find(d => d.id === 1);
      if (none) {
        list = [none, ...list];
      }
    }

    return list;
  }

  private setDefaultDepartment(): void {
    const selectable = this.selectableDepartments;

    if (!this.employee) return;

    // ★修正：現在選択されている部署が、切り替え後の選択肢の中に存在するかチェック
    const exists = selectable.some(
      d => Number(d.id) === Number(this.employee.departmentId)
    );

    // 選択肢の中に今の部署がない場合のみ、先頭の部署をセットする
    if (!exists && selectable.length > 0) {
      this.employee.departmentId = selectable[0].id;
    }
  }
  
  get isAdmin(): boolean {
    return this.employee.role === 'ADMIN' || this.employee.role === 'SYSTEM_ADMIN';
  }
}
