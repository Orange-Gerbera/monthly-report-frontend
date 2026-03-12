import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ButtonComponent } from '../../button/button.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ButtonComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {

  // ← クラスプロパティとして定義
  buttons: ConfirmDialogButton[] = [];

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  ngOnInit(): void {

    // 新方式（3ボタンなど）
    if (this.data.buttons?.length) {
      this.buttons = this.data.buttons;
      return;
    }

    // 旧方式（2ボタン）
    this.buttons = [
      { label: 'キャンセル', value: false, color: 'gray' },
      {
        label: this.data.okLabel ?? 'OK',
        value: true,
        color: this.data.okColor ?? 'blue'
      }
    ];

  }

  onSelect(value: any): void {
    this.dialogRef.close(value);
  }
}

export interface ConfirmDialogButton {
  label: string;
  value: any;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'teal' | 'gray';
}

export interface ConfirmDialogData {
  title: string;
  message: string;

  // 新方式
  buttons?: ConfirmDialogButton[];

  // 旧方式
  okLabel?: string;
  okColor?: 'blue' | 'red' | 'green' | 'yellow' | 'teal' | 'gray';
}