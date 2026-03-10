export interface ReportDto {
  id: number;
  reportMonth: string; // "2025-05" のようなフォーマット（YearMonth）
  submittedAt: string; // ISO文字列
  updatedAt: string;
  contentBusiness: string;
  timeWorked: number;
  timeOver: number;
  rateBusiness: number;
  rateStudy: number;
  trendBusiness: number;
  contentMember: string;
  contentCustomer: string;
  contentProblem: string;
  evaluationBusiness: string;
  evaluationStudy: string;
  goalBusiness: string;
  goalStudy: string;
  contentCompany: string;
  contentOthers: string;
  completeFlg: boolean;
  comment: string;
  reportDeadline: string; // ISO日付
  
  // 承認
  approvalFlg: boolean | null;
  approvedAt: string | null;
  approvedBy: string | null;

  // 受理 ← 追加
  receivedFlg: boolean | null;
  receivedAt: string | null;
  receivedBy: string | null;

  employeeCode: string;
  employeeName: string;
  departmentName: string;
  dueDate: string | null;
}

export interface ReportListResponse {
  listSize: number;
  reportList: ReportDto[];
  dateSet: string[]; // ["2025-05", "2025-04", ...]
  isPastCheck: boolean;
}

export interface ReportResponse {
  report: ReportDto;
}

export type ReportUpsertRequest = Omit<
  ReportDto,
  | 'id'
  | 'submittedAt'
  | 'updatedAt'
  | 'reportDeadline'
  | 'approvalFlg'
  | 'approvedAt'
  | 'approvedBy'
  | 'receivedFlg'
  | 'receivedAt'
  | 'receivedBy'
  | 'comment'
  | 'dueDate'
>;
