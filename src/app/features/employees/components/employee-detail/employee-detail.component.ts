import { Component, OnInit } from '@angular/core';
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
import { take } from 'rxjs';

@Component({
  selector: 'app-employee-detail',
  templateUrl: './employee-detail.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, IconComponent, FormsModule],
})
export class EmployeeDetailComponent implements OnInit {
  employee$!: Observable<EmployeeDto>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code');
    if (code) {
      this.employee$ = this.employeeService.getByCode(code);
    }
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

  toggleActive(employee: EmployeeDto) {
    const req = { ...employee };

    this.employeeService.update(employee.code, req).subscribe({
      next: () => console.log('利用状況更新成功'),
      error: () => {
        alert('更新に失敗しました');
        employee.active = !employee.active;
      },
    });
  }

  onDelete(code: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '従業員の削除',
        message: `従業員コード [${code}] の情報を削除してもよろしいですか？\nこの操作は取り消せません。`,
        okLabel: '削除する',
        okColor: 'red'
      }
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.executeDelete(code);
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
}
