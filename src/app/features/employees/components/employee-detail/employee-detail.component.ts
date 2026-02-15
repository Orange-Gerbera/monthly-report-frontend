import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeDto } from '../../models/employee.dto';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { FormsModule } from '@angular/forms';

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
    private employeeService: EmployeeService
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
    const confirmDelete = confirm('この従業員を削除してもよろしいですか？');
    if (!confirmDelete) return;

    this.employeeService.delete(code).subscribe({
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
