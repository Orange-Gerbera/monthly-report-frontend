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

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    IconComponent,
    MatTableModule,
    MatSortModule
  ],
  templateUrl: './employee-list.component.html',
})
export class EmployeeListComponent implements OnInit, OnDestroy, AfterViewInit {

  dataSource = new MatTableDataSource<EmployeeDto>([]);

  displayedColumns: string[] = [
    'code',
    'name',
    'department',
    'status',
    'system',
    'actions'
  ];

  dataLoaded = false;
  private timer?: any;

  @ViewChild(MatSort) sort?: MatSort;

  constructor(private employeeService: EmployeeService) {

    // ソート用マッピング
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return item.lastName + ' ' + item.firstName;
        case 'department':
          return item.departmentName;
        case 'status':
          return item.employmentStatus;
        case 'system':
          return item.active ? 1 : 0;
        default:
          return (item as any)[property];
      }
    };
  }

  ngOnInit(): void {
    this.loadEmployees();

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
  }

  loadEmployees(): void {
    this.dataLoaded = false;

    this.employeeService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data ?? [];
        this.dataLoaded = true;
      },
      error: () => {
        this.dataSource.data = [];
        this.dataLoaded = true;
      }
    });
  }

  unlock(code: string) {
    if (!confirm(`${code} のロックを解除しますか？`)) return;

    this.employeeService.unlock(code).subscribe({
      next: () => {
        alert('ロックを解除しました');
        this.loadEmployees();
      },
      error: () => alert('解除に失敗しました'),
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
}