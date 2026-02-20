import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { DepartmentService } from '../../services/department.service';
import { DepartmentDto } from '../../models/department.dto';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { ButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-department-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ButtonComponent, MatTableModule],
  templateUrl: './department-settings.component.html',
})
export class DepartmentSettingsComponent implements OnInit {
  dataSource = new MatTableDataSource<DepartmentDto>();
  displayedColumns: string[] = ['id', 'name', 'actions'];

  newDepartmentName = '';
  errorMessage = ''; // エラーメッセージ用のプロパティ
  deleteErrorMessage = ''; // 削除時のエラー

  constructor(private departmentService: DepartmentService) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  // 所属一覧取得
  loadDepartments(): void {
    this.departmentService.getAll().subscribe((data) => {
      this.dataSource.data = data ?? [];
    });
  }

  // 所属追加
  addDepartment(): void {
    const trimmedName = this.newDepartmentName.trim();
    if (!trimmedName) return;

    this.departmentService.create({ name: trimmedName }).subscribe({
      next: (created) => {
        this.dataSource.data = [...this.dataSource.data, created];
        this.newDepartmentName = '';
        this.errorMessage = '';
      },
      error: (err) => {
        // サーバーからのエラーが存在する場合はメッセージを表示
        this.errorMessage = err.error?.message || '所属の追加に失敗しました';
      },
    });
  }

  deleteDepartment(id: number): void {
    this.departmentService.delete(id).subscribe({
      next: () => {
        this.dataSource.data =
          this.dataSource.data.filter((d) => d.id !== id);
        this.deleteErrorMessage = '';
      },
      error: (err) => {
        this.deleteErrorMessage = err.error?.message || '削除に失敗しました';
      },
    });
  }
}
