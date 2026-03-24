import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // HttpParamsを追加
import { Observable, map, of, tap } from 'rxjs';
import { ReportDueDateDto } from '../models/report-due-date.dto';
import { environment } from '../../../../environments/environment';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReportDueDateService {
  private readonly API_URL = `${environment.apiBaseUrl}/report-due-dates`;
  private dueDateCache: ReportDueDateDto[] = [];

  constructor(private http: HttpClient) {}

  /**
   * 一覧取得（+キャッシュ保存）
   */
  getAll(departmentId: number): Observable<ReportDueDateDto[]> {
    const params = new HttpParams().set('departmentId', departmentId.toString());

    return this.http
      .get<any[]>(this.API_URL, {
        params, // 部署IDを追加
        withCredentials: true,
      })
      .pipe(
        map((response) =>
          (response ?? []).map((item) => ({
            id: item.id,
            year: +item.yearmonth.split('-')[0],
            month: +item.yearmonth.split('-')[1],
            dueDateTime: item.dueDate,
          }))
        ),
        tap((dueDates) => this.setCache(dueDates))
      );
  }

  /**
   * キャッシュをセット
   */
  private setCache(dueDates: ReportDueDateDto[]): void {
    this.dueDateCache = dueDates;
  }

  /**
   * キャッシュから特定の年月を取得
   */
  getCached(year: number, month: number): ReportDueDateDto | undefined {
    return this.dueDateCache.find((d) => d.year === year && d.month === month);
  }

  /**
   * サーバー取得（キャッシュがなければ）
   */
  getWithFallback(year: number, month: number, departmentId: number): Observable<ReportDueDateDto> {
    const cached = this.getCached(year, month);
    if (cached) return of(cached);

    const params = new HttpParams().set('departmentId', departmentId.toString());
    return this.http.get<ReportDueDateDto>(`${this.API_URL}/${year}/${month}`, {
      params, // 部署IDを追加
      withCredentials: true,
    });
  }

  /**
   * 年単位で一括登録
   */
  registerYear(year: number, departmentId: number): Observable<void> {
    const params = new HttpParams().set('departmentId', departmentId.toString());

    return this.http
      .post<void>(
        `${this.API_URL}/yearly/${year}`,
        {},
        { params, withCredentials: true } // 部署IDを追加
      )
      .pipe(
        catchError((error) => {
          // 呼び出し元でステータスコードを使って処理できるようエラーをそのまま流す
          return throwError(() => error);
        })
      );
  }

  /**
   * 年単位で一括削除
   */
  deleteYear(year: number, departmentId: number): Observable<void> {
    const params = new HttpParams().set('departmentId', departmentId.toString());

    return this.http
      .delete<void>(`${this.API_URL}/yearly/${year}`, {
        params, // 部署IDを追加
        withCredentials: true,
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * 提出期日を一括更新（存在する年月のみ対象。存在しない場合はAPI側で400エラー）
   */
  updateAll(dueDates: ReportDueDateDto[], departmentId: number): Observable<ReportDueDateDto[]> {
    const params = new HttpParams().set('departmentId', departmentId.toString());

    const requestBody = dueDates.map((dto) => ({
      yearmonth: `${dto.year.toString().padStart(4, '0')}-${dto.month
        .toString()
        .padStart(2, '0')}`,
      dueDate: dto.dueDateTime,
    }));

    return this.http
      .put<
        {
          id: number;
          yearmonth: string;
          dueDate: string;
        }[]
      >(this.API_URL, requestBody, {
        params, // 部署IDを追加
        withCredentials: true,
      })
      .pipe(
        map((response) =>
          (response ?? []).map((item) => ({
            id: item.id,
            year: +item.yearmonth.split('-')[0],
            month: +item.yearmonth.split('-')[1],
            dueDateTime: item.dueDate,
          }))
        ),
        tap((updatedList) => this.setCache(updatedList)),
        catchError((error) => {
          console.error('更新エラー:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 特定の年月の提出期日（LocalDateTime）を取得
   */
  getDueDate(year: number, month: number, departmentId: number): Observable<Date> {
    const yearMonth = `${year.toString().padStart(4, '0')}-${month
      .toString()
      .padStart(2, '0')}`;

    const params = new HttpParams()
      .set('yearMonth', yearMonth)
      .set('departmentId', departmentId.toString()); // 部署IDを追加

    return this.http
      .get<string>(`${this.API_URL}/due-date`, {
        params, // クエリパラメータとして送信
        withCredentials: true,
      })
      .pipe(
        map((dateStr) => new Date(dateStr)), // 文字列 → Date に変換
        catchError((error) => {
          console.error('提出期日取得エラー:', error);
          return throwError(() => error);
        })
      );
  }
}