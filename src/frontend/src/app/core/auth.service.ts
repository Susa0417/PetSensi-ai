import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';
import { AuthResponse } from './models';
import { ApiService } from './api.service';

const AUTH_KEY = 'petsense.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly currentSubject = new BehaviorSubject<AuthResponse | null>(this.readStoredAuth());
  readonly current$ = this.currentSubject.asObservable();

  get current(): AuthResponse | null {
    return this.currentSubject.value;
  }

  get token(): string | null {
    return this.current?.accessToken ?? null;
  }

  login(email: string, password: string) {
    return this.api.login(email, password).pipe(tap((response) => this.store(response)));
  }

  register(payload: { firstName: string; lastName: string; email: string; password: string }) {
    return this.api.register(payload).pipe(tap((response) => this.store(response)));
  }

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
    this.currentSubject.next(null);
    void this.router.navigate(['/']);
  }

  hasRole(role: string): boolean {
    return this.current?.roles.includes(role) ?? false;
  }

  isAuthenticated(): boolean {
    const token = this.token;
    if (!token) {
      return false;
    }

    const payload = parseJwt(token);
    const exp = typeof payload['exp'] === 'number' ? payload['exp'] : 0;
    return exp * 1000 > Date.now();
  }

  private store(response: AuthResponse): void {
    localStorage.setItem(AUTH_KEY, JSON.stringify(response));
    this.currentSubject.next(response);
  }

  private readStoredAuth(): AuthResponse | null {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
  }
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        auth.logout();
      }

      return throwError(() => error);
    })
  );
};

function parseJwt(token: string): Record<string, unknown> {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
  } catch {
    return {};
  }
}
