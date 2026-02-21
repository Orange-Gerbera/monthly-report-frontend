import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { ReportDto, ReportUpsertRequest } from '../../models/report.dto';
import { AuthService } from '../../../auth/services/auth.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { ActivatedRoute } from '@angular/router';
import { ReportFormComponent } from '../report-form/report-form.component';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  standalone: true,
  selector: 'app-report-new',
  imports: [
    CommonModule,
    ReportFormComponent, // 共通フォームを利用
  ],
  templateUrl: './report-new.component.html',
})
export class ReportNewComponent {
  useLatest = false;
  previousUrl: string = '/profile'; 

  report: ReportUpsertRequest = {
    reportMonth: '',
    contentBusiness: '',
    timeWorked: 0,
    timeOver: 0,
    rateBusiness: 0,
    rateStudy: 0,
    trendBusiness: 0,
    contentMember: '',
    contentCustomer: '',
    contentProblem: '【問題点】\n【解決策】\n【ヒヤリハット】',
    evaluationBusiness: '',
    evaluationStudy: '',
    goalBusiness: '',
    goalStudy: '',
    contentCompany: '',
    contentOthers: '',
    completeFlg: false,
    employeeCode: '',
    employeeName: '',
    departmentName: '',
  };

  constructor(
    private reportService: ReportService,
    private router: Router,
    private authService: AuthService,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private location: Location,
    private dialog: MatDialog
  ) {
    const navigation = this.router.getCurrentNavigation();
    // state自体が存在するか、'previousUrl' が含まれているかをチェック
    if (navigation?.extras?.state?.['previousUrl']) {
      this.previousUrl = navigation.extras.state['previousUrl'];
    }
  }

  ngOnInit(): void {
    const useLatestParam = this.route.snapshot.queryParamMap.get('useLatest');
    this.useLatest = useLatestParam === 'true';

    const user = this.authService.getCurrentUser();
    if (user) {
      this.report.employeeCode = user.code;

      this.employeeService.getByCode(user.code).subscribe({
        next: (employee) => {
          // 参照を変える
          this.report = {
            ...this.report,
            employeeName: employee.fullName ?? '',
            departmentName: employee.departmentName ?? '',
          };

          if (this.useLatest) {
            this.loadLatestReport(); // こちらは既に参照を変えていてOK
          }

          const now = new Date();
          this.report = {
            ...this.report,
            reportMonth: `${now.getFullYear()}-${String(
              now.getMonth() + 1
            ).padStart(2, '0')}`,
          };
        },

        error: (err) => {
          console.error('社員情報の取得に失敗しました', err);
        },
      });
    }
  }

  /** 共通フォームから呼ばれる新規作成処理 */
  onCreate(report: ReportUpsertRequest): void {
    console.log('onCreate called!', report);
    this.reportService.createReport(report).subscribe({
      next: (res) => {
        console.log('登録成功:', res);
        alert('報告書を登録しました');
        
        // 固定の ['/reports'] ではなく、保持している previousUrl へ戻る
        this.router.navigateByUrl(this.previousUrl);
      },
      error: (err) => {
        console.error('登録失敗:', err);
        const message =
          err?.error?.message ?? '登録に失敗しました。もう一度お試しください。';
        alert(message);
      },
    });
  }

  // 一覧に戻るボタンの実装
  onBack() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '内容の破棄',
        message: '編集中の内容は保存されませんが、よろしいですか？',
        okLabel: '破棄して戻る',
        okColor: 'red' // 注意を促すため赤
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // ユーザーが「破棄して戻る」を選んだ場合のみ遷移
        this.router.navigateByUrl(this.previousUrl);
      }
    });
  }

  /** 最新レポートの読み込み */
  private loadLatestReport(): void {
    this.reportService.getLatestReport().subscribe({
      next: (latest: ReportDto) => {
        if (latest) {
          this.report = {
            ...this.report, // 既存の値を保持（employeeCode, reportMonthなど）
            contentBusiness: latest.contentBusiness,
            timeWorked: latest.timeWorked,
            timeOver: latest.timeOver,
            rateBusiness: latest.rateBusiness,
            rateStudy: latest.rateStudy,
            trendBusiness: latest.trendBusiness,
            contentMember: latest.contentMember,
            contentCustomer: latest.contentCustomer,
            contentProblem: latest.contentProblem,
            evaluationBusiness: latest.evaluationBusiness,
            evaluationStudy: latest.evaluationStudy,
            goalBusiness: latest.goalBusiness,
            goalStudy: latest.goalStudy,
            contentCompany: latest.contentCompany,
            contentOthers: latest.contentOthers,
          };
        }
      },
      error: (err) => {
        console.error('直近の報告書取得に失敗しました', err);
      },
    });
  }
}
