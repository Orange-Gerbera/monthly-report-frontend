// src/app/features/employees/components/employee-list.component.ts

import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeDto } from '../../models/employee.dto';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SecurityLockService } from '../../../security/services/security-lock.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../auth/services/auth.service';
import { RoleLabelPipe } from '../../../../shared/pipes/role-label.pipe';
import { EmploymentStatusLabelPipe } from '../../../../shared/pipes/employment-status-label.pipe';
import { ContextService } from '../../../../shared/services/context.service';
import { Subject, takeUntil, distinctUntilChanged  } from 'rxjs';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    IconComponent,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    RoleLabelPipe,
    EmploymentStatusLabelPipe   
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit, OnDestroy, AfterViewInit {

  dataSource = new MatTableDataSource<EmployeeDto>([]);

  displayedColumns: string[] = [
    'code',
    'name',
    'department',
    'role',
    'status',
    'system',
    'actions'
  ];

  dataLoaded = false;
  private timer?: any;
  isAdmin = false;
  private currentDeptId?: number;
  private destroy$ = new Subject<void>();

  @ViewChild(MatSort) sort?: MatSort;

  constructor(
    private employeeService: EmployeeService,
    private securityService: SecurityLockService,
    private dialog: MatDialog,
    private authService: AuthService,
    private context: ContextService
  ) {

    // ソート用マッピング
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return item.lastName + ' ' + item.firstName;
        case 'department':
          const primaryDept = item.departments?.find(d => d.primary);
          return primaryDept?.name ?? '';
        case 'status':
          return item.employmentStatus;
        case 'role':
          return item.role;
        case 'system':
          return item.active ? 1 : 0;
        default:
          return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    this.context.selectedDeptId$
       .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe(parentId => {
        this.currentDeptId = parentId ?? undefined;
        this.loadEmployees(this.currentDeptId);
      });

    // ログインユーザーの権限を確認
    this.authService.fetchMe().subscribe({
      next: () => {
        this.isAdmin = this.authService.isAdmin();
      },
      error: (err) => {
        console.error('Auth error:', err);
        this.isAdmin = false;
      }
    });

    // 残り時間更新（旧仕様維持）
    this.timer = setInterval(() => {
      this.dataSource.data = [...this.dataSource.data];
    }, 60000);
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmployees(parentId?: number): void {
    this.dataLoaded = false;

    this.employeeService.getEmployees({
      parentDeptId: parentId
    }).subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        this.dataLoaded = true;
      },
      error: () => {
        this.dataSource.data = [];
        this.dataLoaded = true;
      }
    });
  }

  unlock(code: string) {
   const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'アカウントロック解除',
        message: `社員番号 ${code} のロックを解除してもよろしいですか？`,
        okLabel: '解除する',
        okColor: 'red'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // SecurityLockService 経由で API を叩く
        this.securityService.unlockUser(code).subscribe({
          next: () => {
            // 成功したら再読み込み
            this.loadEmployees(this.currentDeptId);
          },
          error: () => alert('解除に失敗しました')
        });
      }
    });
  }

  remainingTime(lockUntil?: string): string {
    if (!lockUntil) return '';

    const end = new Date(lockUntil).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return '';

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);

    return `残り ${h}時間 ${m}分`;
  }

  getPrimaryDepartmentName(emp: EmployeeDto): string {
    return emp.departments?.find(d => d.primary)?.name ?? '';
  }
}