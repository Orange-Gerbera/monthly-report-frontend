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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { EmployeeRequest } from '../../models/employee.dto';
import { DepartmentService } from '../../../departments/services/department.service';
import { DepartmentDto } from '../../../departments/models/department.dto';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { PasswordUtil } from '../../../../shared/utils/password.util';
import { ContextService } from '../../../../shared/services/context.service';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { filter, switchMap } from 'rxjs/operators';
import { map } from 'rxjs';

@Component({
  selector: 'app-employee-new',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ButtonComponent],
  templateUrl: './employee-new.component.html',
  styleUrls: ['./employee-new.component.scss']
})
export class EmployeeNewComponent implements OnInit, OnDestroy{

  employee: EmployeeRequest = {
    code: '',
    lastName: '',
    firstName: '',
    email: '',
    role: 'GENERAL',
    departmentId: null,
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
  targetDeptName: string = '';

  // =========================
  // ★追加：状態管理
  // =========================
  mode: 'new' | 'same' | 'transfer' = 'new';
  existingEmployee: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private departmentService: DepartmentService,
    private context: ContextService
  ) {
  }

  // =========================
  // 初期化
  // =========================
  ngOnInit(): void {

    // =========================
    // ★ 追加：画面に入った時にロックをかける
    // =========================
    this.context.setLocked(true);

    this.context.contextText.subscribe(name => {
      this.targetDeptName = name; 
    });

    this.context.selectedDeptId$
      .pipe(
        filter((parentId): parentId is number => parentId != null),
        switchMap(parentId =>
          this.departmentService.getAll().pipe(
            map(data => ({ parentId, data }))
          )
        )
      )
      .subscribe(({ parentId, data }) => {
        // 2. 所属プルダウン用のリスト作成（ここだけでOK！）
        this.departments = data.filter(d =>
          Number(d.parentId) === Number(parentId) &&
          d.id !== 1 &&
          d.active
        );

        // --- 修正：ここから下の「異動先名の解決」ロジックはバッサリ削除してください ---
        // ( target の find や unassigned の処理があった場所 )
        // ------------------------------------------------------------------

        console.log(`[DEBUG] parentId: ${parentId}, Dropdown count: ${this.departments.length}`);
      });
  }
  
  // =========================
  // ★ 追加：画面を離れる時にロックを解除する
  // =========================
  ngOnDestroy(): void {
    this.context.setLocked(false);
  }

  // =========================
  // ★追加：従業員存在チェック
  // =========================
  checkEmployeeExists(): void {

    if (!this.employee.code) return;

    const deptId = this.context.getDeptId();
    if (deptId == null) {
      return;
    }

    this.http.get(`/api/employees/exists/${this.employee.code}`, {
      params: {
        deptId: deptId
      }
    })
    .subscribe({
      next: (res: any) => {

        this.existingEmployee = res;

        if (!res.exists) {
          this.mode = 'new';
          return;
        }

        if (res.sameDepartment) {
          this.mode = 'same';
        } else {
          this.mode = 'transfer';
        }
      },
      error: () => {
        this.mode = 'new';
        this.existingEmployee = null;
      }
    });
  }

  // =========================
  // 登録処理
  // =========================
  onSubmit(form: NgForm): void {

    // ★追加：状態ガード（最重要）
    if (this.mode === 'same') {
      alert('この従業員は既にこの部署に所属しています。');
      return;
    }

    if (this.mode === 'transfer') {
      alert('この従業員は既に他部署に所属しています。異動を行ってください。');
      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.employee.departmentId) {
      alert('所属を選択してください');
      return;
    }

    const password = this.employee.password ?? '';

    // 🔹 パスワードが入力されている場合のみチェック
    if (password) {

      if (!PasswordUtil.isFormatValid(password)) {
        alert('パスワード形式が正しくありません');
        return;
      }
      
      const requiredScore = this.getRequiredScore();

      if (!PasswordUtil.isStrong(password, this.employee.email, requiredScore)) {
        alert(
          this.employee.role === 'ADMIN'
            ? '管理者用のパスワードとしては強度が足りません。'
            : 'パスワードが弱すぎます。'
        );
        return;
      }
    }

    this.http.post('/api/employees', this.employee).subscribe({
      next: () => {

        if (!password) {
          alert('登録が完了しました。\n招待メールを送信しました。');
        } else {
          alert('登録が完了しました。');
        }

        this.router.navigate(['/employees']);
      },
      error: (err) =>
        alert('登録に失敗しました: ' + (err.error?.message || err.statusText)),
    });
  }

  // =========================
  // ★ 修正：異動処理
  // =========================
  transferEmployee(): void {
    if (!this.employee.code) return;

    // 1. ContextService から現在の「正しい部署ID」を取得
    const deptId = this.context.getDeptId();
    
    if (deptId == null) {
      alert('異動先の部署IDが取得できません。');
      return;
    }

    // 2. POSTリクエストに deptId を含める
    // 存在チェック(exists)と同じように params で送るか、bodyに含める必要があります
    this.http.post(`/api/employees/${this.employee.code}/transfer`, {}, {
      params: {
        deptId: String(deptId) // 文字列としてクエリパラメータにセット
      }
    })
    .subscribe({
      next: () => {
        alert('異動しました');
        // UIの状態を最新にする（「既に所属しています」の状態へ）
        this.checkEmployeeExists();
      },
      error: (err) => {
        console.error('異動失敗:', err);
        const message = err.error?.message || '異動に失敗しました';
        alert(message);
      }
    });
  }

  // =========================
  // email / role変更時の再チェック
  // =========================
  onEmailChange(): void {
    this.recheckPassword();
  }

  onRoleChange(): void {
    this.recheckPassword();
  }

  private recheckPassword(): void {
    if (this.employee.password) {
      this.checkPasswordStrength(this.employee.password);
    }
  }

  // =========================
  // パスワード強度表示
  // =========================
  checkPasswordStrength(password: string): void {

    if (!password) {
      this.passwordStrength = '';
      this.passwordStrengthClass = '';
      this.passwordScore = 0;
      return;
    }

    if (!PasswordUtil.isFormatValid(password)) {
      this.passwordStrength = 'パスワード形式が正しくありません。';
      this.passwordStrengthClass = 'text-danger';
      this.passwordScore = 0;
      return;
    }

    const result = PasswordUtil.getStrength(password, this.employee.email);
    this.passwordScore = result.score;

    const requiredScore = this.getRequiredScore();

    if (result.score >= requiredScore) {
      this.passwordStrength =
        this.employee.role === 'ADMIN'
          ? '管理者用として使用可能なパスワードです。'
          : '使用可能なパスワードです。';
      this.passwordStrengthClass = 'text-success';
    } else {
      this.passwordStrength =
        this.employee.role === 'ADMIN'
          ? '管理者用のパスワードとしては強度が足りません。'
          : 'パスワードが弱すぎます。';
      this.passwordStrengthClass = 'text-danger';
    }
  }

  // =========================
  // 送信ボタン制御
  // =========================
  isPasswordInvalid(): boolean {

    const password = this.employee.password ?? '';

    // 🔹 空欄はOK（招待メールモード）
    if (!password) return false;

    return (
      !PasswordUtil.isFormatValid(password) ||
      this.passwordScore < this.getRequiredScore()
    );
  }

  private getRequiredScore(): number {
    return this.employee.role === 'ADMIN' ? 4 : 3;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  sanitizePassword(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = PasswordUtil.sanitize(input.value);

    input.value = sanitized;
    this.employee.password = sanitized;
  }

  trackByDeptId(index: number, dept: DepartmentDto) {
    return dept.id;
  }

}