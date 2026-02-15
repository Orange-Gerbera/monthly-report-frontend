import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ReportUpsertRequest } from '../../models/report.dto';
import { CharCountComponent } from '../../../../shared/char-count/char-count.component';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatInputModule } from '@angular/material/input';
import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CharCountComponent,
    ButtonComponent,
    MatDialogModule,
    MatTooltipModule,
    TextFieldModule,
    MatInputModule,
    IconComponent,
  ],
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.scss'],
})
export class ReportFormComponent {
  /** 親から受け取るモデル（新規 or 編集の元データ） */
  @Input() model!: ReportUpsertRequest;

  /** 画面モード */
  @Input() mode: 'create' | 'edit' = 'create';

  /** ボタンラベル */
  @Input() submitLabel = '登録';
  @Input() backLabel = '一覧に戻る';

  /** 出力イベント */
  @Output() formSubmit = new EventEmitter<ReportUpsertRequest>();
  @Output() cancel = new EventEmitter<void>();

  /** 編集用コピー */
  formModel!: ReportUpsertRequest;

  /** 時間の分割用バッファ */
  timeWorkedHour = 0;
  timeWorkedMinute = 0;
  timeOverHour = 0;
  timeOverMinute = 0;

  ngOnInit() {
    this.formModel = this.model
      ? structuredClone(this.model)
      : ({} as ReportUpsertRequest);

    if (this.formModel.timeWorked != null) {
      this.timeWorkedHour = Math.floor(this.formModel.timeWorked / 60);
      this.timeWorkedMinute = this.formModel.timeWorked % 60;
    }
    if (this.formModel.timeOver != null) {
      this.timeOverHour = Math.floor(this.formModel.timeOver / 60);
      this.timeOverMinute = this.formModel.timeOver % 60;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['model'] && this.model) {
      this.formModel = structuredClone(this.model);

      if (this.formModel.timeWorked != null) {
        this.timeWorkedHour = Math.floor(this.formModel.timeWorked / 60);
        this.timeWorkedMinute = this.formModel.timeWorked % 60;
      }
      if (this.formModel.timeOver != null) {
        this.timeOverHour = Math.floor(this.formModel.timeOver / 60);
        this.timeOverMinute = this.formModel.timeOver % 60;
      }
    }
  }

  onSubmit(form: NgForm) {
    if (form.invalid) return;

    this.formModel.timeWorked =
      this.timeWorkedHour * 60 + this.timeWorkedMinute;
    this.formModel.timeOver = this.timeOverHour * 60 + this.timeOverMinute;

    this.formSubmit.emit(this.formModel);
  }

  onCancel() {
    this.cancel.emit();
  }
}
