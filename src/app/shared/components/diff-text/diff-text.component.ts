import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as DiffMatchPatch from 'diff-match-patch';

@Component({
  selector: 'app-diff-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="showDiff; else normalText">
      <ng-container *ngFor="let part of diffs">
        <span *ngIf="part[0] !== -1" [ngClass]="getDiffClass(part[0])">
          {{ part[1] }}
        </span>
      </ng-container>
    </ng-container>
    <ng-template #normalText>{{ current }}</ng-template>
  `,
  styles: [`
    .diff-unchanged { 
      color: #adb5bd; 
    } 
    .diff-added { 
      color: #212529; 
      font-weight: bold; 
      background-color: #e6ffec; 
      /* border-bottom: 2px solid #28a745; 追加を強調したい場合は下線を残す */
    }
  `]
})
export class DiffTextComponent implements OnChanges {
  @Input() current: string | number | null = '';
  @Input() previous: string | number | null = '';
  @Input() showDiff: boolean = false;

  diffs: any[] = [];
  private dmp = new DiffMatchPatch.diff_match_patch();

  ngOnChanges(changes: SimpleChanges) {
    this.generateDiff();
  }

  private generateDiff() {
    // 文字列に変換して比較
    const prev = String(this.previous ?? '');
    const curr = String(this.current ?? '');
    
    const diffResult = this.dmp.diff_main(prev, curr);
    // 意味のある単位（単語など）にクリーンアップして読みやすくする
    this.dmp.diff_cleanupSemantic(diffResult);
    this.diffs = diffResult;
  }

  getDiffClass(op: number) {
    return {
      'diff-unchanged': op === 0,
      'diff-added': op === 1,
      'diff-deleted': op === -1
    };
  }
}