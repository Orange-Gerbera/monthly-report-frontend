import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-simple-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title || '操作できません' }}</h2>

    <div mat-dialog-content>
      {{ data.message }}
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>OK</button>
    </div>
  `
})
export class SimpleDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { title?: string; message: string }
  ) {}
}