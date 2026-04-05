import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { RouterModule } from '@angular/router';
import { Submission } from '../../../../shared/models/submission.model';
import { SimpleChanges } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-submission-table',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    RouterModule,
    MatTooltipModule,
 ],
  templateUrl: './submission-table.component.html',
  styleUrls: ['./submission-table.component.scss'],
})
export class SubmissionTableComponent {

  @Input() date!: Date;

  @Input() getButtonLabel!: (data: Submission) => string;
  @Input() getButtonIcon!: (data: Submission) => string;
  @Input() onAction!: (data: Submission) => void;

  dataList: Submission[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['date'] && this.date) {
      this.initData();
    }
  }

  initData() {

    // 本来は date を使って取得
    this.dataList = [
      {
        type: 'MONTHLY',
        inputMethod: 'WEB',
        name: '月次業務報告書',
        dueDate: '2026-04-30T18:00:00',
        submittedAt: null,
        status: { received: null, approved: null },
        id: 1
      },
      {
        type: 'PROJECT',
        inputMethod: 'WEB',
        name: '月間成果報告書（ICTS提出用）',
        dueDate: '2026-05-01T18:00:00',
        submittedAt: null,
        status: { received: null, approved: null },
        id: 2
      },
      {
        type: 'EXPENSE',
        inputMethod: 'FILE',
        name: '交通費精算',
        dueDate: '2026-04-17T17:00:00',
        submittedAt: null,
        status: { received: null, approved: null },
        id: 3
      }
    ];
  }

}