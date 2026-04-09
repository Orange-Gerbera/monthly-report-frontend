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
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '../../services/department.service';
import { DepartmentDto } from '../../models/department.dto';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { ContextService } from '../../../../shared/services/context.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SimpleDialogComponent } from '../../../../shared/components/simple-dialog/simple-dialog.component';
import { Subject, takeUntil, switchMap } from 'rxjs';

@Component({
  selector: 'app-department-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    ButtonComponent,
    MatTooltipModule,
    MatDialogModule   
  ],
  templateUrl: './department-settings.component.html',
  styleUrls: ['./department-settings.component.scss']
})
export class DepartmentSettingsComponent implements OnInit {

  departments: DepartmentDto[] = [];

  newDepartmentName = '';
  errorMessage = '';
  deleteErrorMessage = '';

  // ⭐ 追加
  private currentDeptId?: number;
  // ★ メモリリーク防止用の Subject
  private destroy$ = new Subject<void>();

  constructor(
    private departmentService: DepartmentService,
    private context: ContextService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // =========================
    // ★ switchMap を使って「コンテキスト切り替え」と「データ取得」を一本化
    // =========================
    this.context.selectedDeptId$
      .pipe(
        takeUntil(this.destroy$), // 画面を離れたら自動解除
        switchMap((deptId) => {
          this.currentDeptId = deptId ?? undefined;
          if (this.currentDeptId === undefined) {
            return []; // IDがない場合は空配列を流す
          }
          // IDがある場合、即座に部署一覧を取得
          return this.departmentService.getAll();
        })
      )
      .subscribe({
        next: (data) => {
          // 型ガードを入れてフィルタリング
          this.departments = (data ?? []).filter(d =>
            Number(d.parentId) === Number(this.currentDeptId)
          );
        },
        error: (err) => console.error('部署取得失敗', err)
      });
  }

  // ★ 画面を離れる時に全ての購読をストップ
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDepartmentsWithParent(parentId: number): void {
    this.departmentService.getAll().subscribe((data) => {

      this.departments = (data ?? []).filter(d =>
        Number(d.parentId) === Number(parentId)
      );

    });
  }

  addDepartment(): void {
    const trimmedName = this.newDepartmentName.trim();
    if (!trimmedName || this.currentDeptId == null) return;

    this.departmentService.create({
      name: trimmedName,
      parentId: this.currentDeptId, // ⭐ 修正
      active: true
    }).subscribe({
      next: (created) => {
        this.departments = [...this.departments, created];
        this.newDepartmentName = '';
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.error?.message || '所属の追加に失敗しました';
      },
    });
  }

  deleteDepartment(id: number): void {

    if (!confirm('この所属を削除してもよろしいですか？')) {
      return;
    }

    this.departmentService.delete(id).subscribe({
      next: () => {
        this.departments = this.departments.filter(d => d.id !== id);
        this.deleteErrorMessage = '';
      },
      error: (err) => {
        this.deleteErrorMessage = err.error?.message || '削除に失敗しました';
      },
    });
  }

  toggleByDot(dept: DepartmentDto): void {

    const newValue = !dept.active;

    this.departmentService.updateActive(dept.id, newValue)
      .subscribe({
        next: () => {
          dept.active = newValue;
        },
        error: (err) => {

          this.dialog.open(SimpleDialogComponent, {
            data: {
              title: 'エラー',
              message: err.error?.message || '変更できません'
            }
          });

        }
      });
  }

  onDotClick(dept: DepartmentDto): void {

    if (this.isDisabled(dept)) {
      this.dialog.open(SimpleDialogComponent, {
        data: {
          title: '無効化できません',
          message: this.getDisableReason(dept)
        }
      });
      return;
    }

    this.toggleByDot(dept);
  }

  isDisabled(dept: DepartmentDto): boolean {
    return dept.active && dept.hasEmployee;
  }

  getDisableReason(dept: DepartmentDto): string {
    if (dept.active && dept.hasEmployee) {
      return '従業員が所属しているため無効化できません';
    }
    return '';
  }

  isDeleteDisabled(dept: DepartmentDto): boolean {
    return dept.hasEmployee || dept.hasReport;
  }

  getDeleteTooltip(dept: DepartmentDto): string {

    if (dept.hasEmployee) {
      return '従業員が所属しているため削除できません';
    }

    if (dept.hasReport) {
      return '報告書で使用されているため削除できません';
    }

    return 'この所属を削除します';
  }
}