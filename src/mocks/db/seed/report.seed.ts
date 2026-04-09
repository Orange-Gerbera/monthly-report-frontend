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

import type { ReportDto } from '../../../app/features/reports/models/report.dto';

const lastDay = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`;
};

export function seedReports(): ReportDto[] {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      reportMonth: '2025-10',
      submittedAt: now,
      updatedAt: now,

      contentBusiness: '新規開拓と保守対応を実施',
      timeWorked: 160,
      timeOver: 12,
      rateBusiness: 70,
      rateStudy: 30,
      trendBusiness: 1,
      contentMember: 'A君のフォロー',
      contentCustomer: 'B社定例',
      contentProblem: 'C案件の遅延',
      evaluationBusiness: '安定',
      evaluationStudy: 'TypeScript強化',
      goalBusiness: '新規顧客2件',
      goalStudy: 'RxJSの理解',
      contentCompany: '社内LT登壇',
      contentOthers: '特になし',

      completeFlg: false,
      comment: '',
      reportDeadline: lastDay('2025-10'),

      approvalFlg: null,
      approvedAt: null,
      approvedBy: null,
      approvedByName: null,

      receivedFlg: null,
      receivedAt: null,
      receivedBy: null,
      receivedByName: null,

      employeeCode: '1234',
      employeeName: '田中 太郎',
      departmentName: '営業部',
      dueDate: null,
    },
    {
      id: 2,
      reportMonth: '2025-09',
      submittedAt: now,
      updatedAt: now,

      contentBusiness: '資料作成と運用保守',
      timeWorked: 152,
      timeOver: 8,
      rateBusiness: 60,
      rateStudy: 40,
      trendBusiness: 0,
      contentMember: '1on1実施',
      contentCustomer: '問い合わせ対応',
      contentProblem: 'ナレッジ不足',
      evaluationBusiness: 'やや課題',
      evaluationStudy: 'Jest導入',
      goalBusiness: '既存客の深耕',
      goalStudy: 'テスト自動化',
      contentCompany: '社内勉強会参加',
      contentOthers: '',

      completeFlg: true,
      comment: 'OK',
      reportDeadline: lastDay('2025-09'),

      approvalFlg: true,
      approvedAt: now,
      approvedBy: '2345',
      approvedByName: '田中 太郎',

      receivedFlg: true,
      receivedAt: now,
      receivedBy: '2345',
      receivedByName: '田中 太郎',

      employeeCode: '5678',
      employeeName: '山田 花子',
      departmentName: '開発部',
      dueDate: null,
    },
  ];
}