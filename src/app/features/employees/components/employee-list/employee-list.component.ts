// src/app/features/employees/components/employee-list.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeDto } from '../../models/employee.dto';
import { ButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './employee-list.component.html',
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  employees: EmployeeDto[] = [];
  loading: boolean = true;
  private timer?: any;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadEmployees();

    this.timer = setInterval(() => {
      this.employees = [...this.employees];
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  // 一覧読み込み
  loadEmployees(): void {
    this.loading = true;

    this.employeeService.getAll().subscribe((data) => {
      this.employees = data ?? [];
      this.loading = false;
    });
  }

  unlock(code: string) {
    if (!confirm(`${code} のロックを解除しますか？`)) return;

    this.employeeService.unlock(code).subscribe({
      next: () => {
        alert('ロックを解除しました');
        this.loadEmployees(); // 再読込
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

