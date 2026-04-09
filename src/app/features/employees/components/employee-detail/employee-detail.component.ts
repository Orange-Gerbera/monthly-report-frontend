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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeDto } from '../../models/employee.dto';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { RoleLabelPipe } from '../../../../shared/pipes/role-label.pipe';
import { EmploymentStatusLabelPipe } from '../../../../shared/pipes/employment-status-label.pipe';
import { ContextService } from '../../../../shared/services/context.service';
import { map, catchError } from 'rxjs/operators';
import { take, throwError  } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-employee-detail',
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonComponent,
    IconComponent,
    FormsModule,
    RoleLabelPipe,
    EmploymentStatusLabelPipe
  ],
})
export class EmployeeDetailComponent implements OnInit, OnDestroy {

  employee$!: Observable<EmployeeDto>;

  currentUserCode = '';
  currentUserRole = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private context: ContextService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // =========================
    // ★ 追加：詳細画面表示時にコンテキストをロック
    // =========================
    this.context.setLocked(true);

    this.employeeService.getCurrentUser().subscribe(user => {
      this.currentUserCode = user.code;
      this.currentUserRole = user.role;
    });

    const code = this.route.snapshot.paramMap.get('code');

    if (code) {
      this.employee$ = this.employeeService.getByCode(code).pipe(
        catchError(err => {
          if (err.status === 403) {
            this.router.navigate(['/employees']);
          }
          return throwError(() => err);
        })
      );
    }
  }

  // =========================
  // ★ 追加：画面を離れる時にロックを解除
  // =========================
  ngOnDestroy(): void {
    this.context.setLocked(false);
  }

  canEdit(employee: EmployeeDto): boolean {

    console.log('currentUserRole=', this.currentUserRole);
    console.log('employeeRole=', employee.role);

    // SYSTEM_ADMINは全員編集可
    if (this.currentUserRole === 'SYSTEM_ADMIN') {
      return true;
    }

    // ADMINはSYSTEM_ADMIN以外編集可
    if (this.currentUserRole === 'ADMIN') {
      return employee.role !== 'SYSTEM_ADMIN';
    }

    // GENERALは自分のみ
    if (this.currentUserRole === 'GENERAL') {
      return employee.code === this.currentUserCode;
    }

    return false;
  }

  toggleActive(employee: EmployeeDto): void {
     if (employee.role === 'SYSTEM_ADMIN') {
      alert('システム管理者は利用停止できません');
      employee.active = true;
      return;
    }

      const req = {
        code: employee.code,
        lastName: employee.lastName,
        firstName: employee.firstName,
        email: employee.email,
        role: employee.role,
        departmentId: employee.primaryDepartmentId, 
        employmentStatus: employee.employmentStatus,
        active: employee.active
      };

    this.employeeService.update(employee.code, req).subscribe({
      next: () => {
        console.log('利用状況更新成功');
        this.authService.refreshCurrentUser();
      },
      error: (err) => {
        const message = err?.error?.message;
        alert(message || '更新に失敗しました');
        employee.active = !employee.active;
      }
    });
  }

  onDelete(employee: EmployeeDto): void {
    if (employee.role === 'SYSTEM_ADMIN') {
      alert('システム管理者は削除できません');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '従業員の削除',
        message: `従業員コード [${employee.code}] の情報を削除してもよろしいですか？\nこの操作は取り消せません。`,
        okLabel: '削除する',
        okColor: 'red'
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.executeDelete(employee.code);
      }
    });
  }

  private executeDelete(code: string): void {
    this.employeeService.delete(code).pipe(take(1)).subscribe({
      next: () => {
        alert('削除に成功しました');
        this.router.navigate(['/employees']);
      },
      error: (err) => {
        console.error('削除失敗:', err);
        alert('削除に失敗しました');
      },
    });
  }

  issueToken(employee: EmployeeDto): void {

    if (employee.role === 'SYSTEM_ADMIN') {
      alert('システム管理者にはリセットメールを送信できません');
      return;
    }

    this.employeeService
      .issuePasswordResetAdmin(employee.code, employee.email)
      .subscribe({
        next: () => alert('リセットメールを送信しました'),
        error: () => alert('送信に失敗しました')
      });
  }

  getDepartmentPath(employee: EmployeeDto): string {
    return employee.departments
      ?.find(d => d.primary)
      ?.name ?? '';
  }
}