import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AiInsight,
  AuthResponse,
  ContactSubmission,
  DailyProgressCharts,
  DailyProgressSummary,
  MediaFile,
  NutritionPlan,
  PagedResult,
  PetProfile,
  WebsiteHome,
  WorkflowAnalysis,
  WorkflowProgress,
  WorkflowStatus
} from './models';

type PetSenseWindow = Window & {
  __PETSENSE_CONFIG__?: {
    apiUrl?: string;
  };
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = this.resolveApiUrl();
  private readonly apiOrigin = this.baseUrl.replace(/\/api\/?$/, '');

  private resolveApiUrl(): string {
    const runtimeApiUrl = typeof window === 'undefined'
      ? ''
      : ((window as PetSenseWindow).__PETSENSE_CONFIG__?.apiUrl ?? '');
    const normalizedRuntimeApiUrl = this.normalizeApiUrl(runtimeApiUrl);

    if (!environment.production && normalizedRuntimeApiUrl === '/api') {
      return this.normalizeApiUrl(environment.apiUrl);
    }

    return normalizedRuntimeApiUrl || this.normalizeApiUrl(environment.apiUrl);
  }

  private normalizeApiUrl(apiUrl: string): string {
    const normalized = apiUrl.trim().replace(/\/$/, '');

    if (!normalized) {
      return '';
    }

    if (normalized === '/api' || normalized.endsWith('/api')) {
      return normalized;
    }

    if (/^https?:\/\//i.test(normalized)) {
      return `${normalized}/api`;
    }

    return normalized;
  }

  list<T>(path: string, search = '', page = 1, pageSize = 50): Observable<PagedResult<T>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PagedResult<T>>(`${this.baseUrl}/${path}`, { params });
  }

  get<T>(path: string, id: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${path}/${id}`);
  }

  create<T>(path: string, body: Partial<T>): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${path}`, body);
  }

  update<T extends { id: string }>(path: string, body: T): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${path}/${body.id}`, body);
  }

  delete(path: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${path}/${id}`);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${path}`, body);
  }

  rawGet<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${path}`);
  }

  websiteHome(): Observable<WebsiteHome> {
    return this.http.get<WebsiteHome>(`${this.baseUrl}/website/home`);
  }

  joinWaitlist(submission: Partial<ContactSubmission>): Observable<ContactSubmission> {
    return this.http.post<ContactSubmission>(`${this.baseUrl}/website/waitlist`, submission);
  }

  generateInsight(petProfileId: string): Observable<AiInsight> {
    return this.http.post<AiInsight>(`${this.baseUrl}/ai-insights/generate/${petProfileId}`, {});
  }

  workflowStatus(): Observable<WorkflowStatus> {
    return this.http.get<WorkflowStatus>(`${this.baseUrl}/workflow/status`);
  }

  workflowPets(): Observable<PetProfile[]> {
    return this.http.get<PetProfile[]>(`${this.baseUrl}/workflow/pets`);
  }

  workflowAnalysis(petProfileId: string): Observable<WorkflowAnalysis> {
    return this.http.get<WorkflowAnalysis>(`${this.baseUrl}/workflow/analysis`, {
      params: new HttpParams().set('petProfileId', petProfileId)
    });
  }

  workflowInsight(petProfileId: string): Observable<AiInsight> {
    return this.http.post<AiInsight>(`${this.baseUrl}/workflow/insights/${petProfileId}`, {});
  }

  workflowProgress(petProfileId: string, from?: string, to?: string): Observable<WorkflowProgress> {
    let params = new HttpParams().set('petProfileId', petProfileId);
    if (from) {
      params = params.set('from', from);
    }
    if (to) {
      params = params.set('to', to);
    }

    return this.http.get<WorkflowProgress>(`${this.baseUrl}/workflow/progress`, { params });
  }

  generateNutritionPlan(payload: Partial<NutritionPlan> & { nutritionPlanId?: string | null }): Observable<NutritionPlan> {
    return this.http.post<NutritionPlan>(`${this.baseUrl}/nutrition-plans/generate`, payload);
  }

  dailyProgressSummary(petProfileId: string): Observable<DailyProgressSummary> {
    return this.http.get<DailyProgressSummary>(`${this.baseUrl}/daily-progress/pet/${petProfileId}/summary`);
  }

  dailyProgressCharts(petProfileId: string): Observable<DailyProgressCharts> {
    return this.http.get<DailyProgressCharts>(`${this.baseUrl}/daily-progress/pet/${petProfileId}/charts`);
  }

  mediaUrl(url?: string | null): string {
    if (!url) {
      return '';
    }

    if (/^(https?:|data:|blob:)/i.test(url)) {
      return url;
    }

    if (url.startsWith('/uploads/')) {
      return `${this.apiOrigin}${url}`;
    }

    return url.startsWith('/') ? url : `/${url}`;
  }

  uploadMedia(file: File, category: string, altText: string, admin = false): Observable<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('altText', altText);
    const path = admin ? 'admin/media-files/upload' : 'media-files/upload';
    return this.http.post<MediaFile>(`${this.baseUrl}/${path}`, formData);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, { email, password });
  }

  register(payload: { firstName: string; lastName: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, payload);
  }
}
