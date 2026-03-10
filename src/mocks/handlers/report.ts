import { http, HttpResponse } from 'msw';
import { reportStore } from '../db/report.store';
import type {
  ReportDto,
  ReportListResponse,
  ReportResponse,
  ReportUpsertRequest,
} from '../../app/features/reports/models/report.dto';

const isoNow = () => new Date().toISOString();
const lastDay = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`;
};

function filterByQuery(url: URL, rows: ReportDto[]) {
  const month =
    url.searchParams.get('month') || url.searchParams.get('reportMonth');
  const employee =
    url.searchParams.get('employee') || url.searchParams.get('employeeCode');
  const keyword = url.searchParams.get('q') || url.searchParams.get('keyword');

  let res = rows.slice();
  if (month) res = res.filter((r) => r.reportMonth === month);
  if (employee) res = res.filter((r) => r.employeeCode === employee);

  if (keyword) {
    const kw = keyword.toLowerCase();
    res = res.filter((r) => {
      const cb = (r?.contentBusiness ?? '').toLowerCase();
      const en = (r?.employeeName ?? '').toLowerCase();
      const dn = (r?.departmentName ?? '').toLowerCase();
      return cb.includes(kw) || en.includes(kw) || dn.includes(kw);
    });
  }

  res.sort((a, b) =>
    a.updatedAt > b.updatedAt ? -1 : a.updatedAt < b.updatedAt ? 1 : 0
  );
  return res;
}

function buildListExtras(rows: ReportDto[]) {
  const dateSet = Array.from(new Set(rows.map((r) => r.reportMonth)))
    .sort()
    .reverse();

  const now = new Date();
  const ymNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}`;

  // 形式が崩れていても落ちないよう保険
  const isPastCheck = rows.some((r) => (r?.reportMonth ?? '9999-99') < ymNow);
  return { dateSet, isPastCheck };
}

export const reportHandlers = [
  // report.ts の一覧ハンドラを置き換え
  http.get('/api/reports', ({ request }) => {
    try {
      const url = new URL(request.url);
      const rows = Array.isArray(reportStore.reports)
        ? reportStore.reports
        : [];

      // 防御的フィルタ
      const month =
        url.searchParams.get('month') || url.searchParams.get('reportMonth');
      const employee =
        url.searchParams.get('employee') ||
        url.searchParams.get('employeeCode');
      const keyword =
        url.searchParams.get('q') || url.searchParams.get('keyword');

      let filtered = rows.slice();

      if (month) filtered = filtered.filter((r) => r?.reportMonth === month);
      if (employee)
        filtered = filtered.filter((r) => r?.employeeCode === employee);

      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = filtered.filter((r) => {
          const cb = (r?.contentBusiness ?? '').toString().toLowerCase();
          const en = (r?.employeeName ?? '').toString().toLowerCase();
          const dn = (r?.departmentName ?? '').toString().toLowerCase();
          return cb.includes(kw) || en.includes(kw) || dn.includes(kw);
        });
      }

      // updatedAt 降順（未定義でも落ちないように）
      filtered.sort((a, b) => {
        const av = (a?.updatedAt ?? '') as string;
        const bv = (b?.updatedAt ?? '') as string;
        return av > bv ? -1 : av < bv ? 1 : 0;
      });

      // dateSet / isPastCheck の算出も安全に
      const allMonths = rows
        .map((r) => r?.reportMonth)
        .filter((v): v is string => typeof v === 'string');
      const dateSet = Array.from(new Set(allMonths)).sort().reverse();

      const now = new Date();
      const ymNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      const isPastCheck = rows.some(
        (r) => (r?.reportMonth ?? '9999-99') < ymNow
      );

      const res: ReportListResponse = {
        listSize: filtered.length,
        reportList: filtered as ReportDto[],
        dateSet,
        isPastCheck,
      };

      return HttpResponse.json(res, { status: 200 });
    } catch (e) {
      // SW(サービスワーカー)側のコンソールに出ます
      // Chrome: DevTools > Application > Service Workers > "inspect" から確認
      // eslint-disable-next-line no-console
      console.error('[MSW] /api/reports handler error:', e);
      return HttpResponse.json(
        { message: 'Internal Server Error (mock)' },
        { status: 500 }
      );
    }
  }),

  http.get('/api/reports/:id', ({ params }) => {
    // params はインデックスシグネチャを持つので ['id'] でアクセスする
    const idStr = (params as Record<string, string | undefined>)['id'];
    if (!idStr) {
      return HttpResponse.json(
        { message: 'Bad Request: id is required' },
        { status: 400 }
      );
    }

    const id = Number(idStr);
    const item = reportStore.reports.find((r) => r.id === id);

    if (!item) {
      return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
    }

    const res: ReportResponse = { report: item };
    return HttpResponse.json(res, { status: 200 });
  }),

  http.post('/api/reports', async ({ request }) => {
    const body = (await request.json()) as ReportUpsertRequest;
    const now = isoNow();

    const created: ReportDto = {
      id: reportStore.nextId(),
      reportMonth: body.reportMonth,
      submittedAt: now,
      updatedAt: now,

      approvedAt: null,
      approvedBy: null,

      receivedFlg: null,
      receivedAt: null,
      receivedBy: null,

      contentBusiness: body.contentBusiness ?? '',
      timeWorked: body.timeWorked ?? 0,
      timeOver: body.timeOver ?? 0,
      rateBusiness: body.rateBusiness ?? 0,
      rateStudy: body.rateStudy ?? 0,
      trendBusiness: body.trendBusiness ?? 0,
      contentMember: body.contentMember ?? '',
      contentCustomer: body.contentCustomer ?? '',
      contentProblem: body.contentProblem ?? '',
      evaluationBusiness: body.evaluationBusiness ?? '',
      evaluationStudy: body.evaluationStudy ?? '',
      goalBusiness: body.goalBusiness ?? '',
      goalStudy: body.goalStudy ?? '',
      contentCompany: body.contentCompany ?? '',
      contentOthers: body.contentOthers ?? '',
      completeFlg: body.completeFlg ?? false,
      comment: '',
      reportDeadline: lastDay(body.reportMonth),
      approvalFlg: null,
      employeeCode: body.employeeCode ?? '',
      employeeName: body.employeeName ?? '',
      departmentName: body.departmentName ?? '',
      dueDate: null,
    };

    reportStore.reports.push(created);
    return HttpResponse.json<ReportResponse>(
      { report: created },
      { status: 201 }
    );
  }),

  // PUT /api/reports/:id
  http.put('/api/reports/:id', async ({ params, request }) => {
    const idStr = (params as Record<string, string | undefined>)['id'];
    if (!idStr || Number.isNaN(Number(idStr))) {
      return HttpResponse.json(
        { message: 'Bad Request: id is required' },
        { status: 400 }
      );
    }
    const id = Number(idStr);

    const idx = reportStore.reports.findIndex((r) => r.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
    }

    const patch = (await request.json()) as ReportUpsertRequest;
    const now = isoNow();
    const cur = reportStore.reports[idx];

    reportStore.reports[idx] = {
      ...cur,
      ...patch,
      updatedAt: now,
      reportDeadline: lastDay(patch.reportMonth ?? cur.reportMonth),
    };

    return HttpResponse.json<ReportResponse>(
      { report: reportStore.reports[idx] },
      { status: 200 }
    );
  }),

  // DELETE /api/reports/:id
  http.delete('/api/reports/:id', ({ params }) => {
    const idStr = (params as Record<string, string | undefined>)['id'];
    if (!idStr || Number.isNaN(Number(idStr))) {
      return HttpResponse.json(
        { message: 'Bad Request: id is required' },
        { status: 400 }
      );
    }
    const id = Number(idStr);

    const idx = reportStore.reports.findIndex((r) => r.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
    }

    reportStore.reports.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
