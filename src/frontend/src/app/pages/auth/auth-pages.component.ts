import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { SHARED_IMPORTS } from '../../shared/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <main class="auth-page">
      <section class="auth-panel">
        <a class="brand" routerLink="/"><span class="brand-mark">P</span><span>PetSense AI</span></a>
        <h1>Welcome back</h1>
        <p>Manage your pet care workspace.</p>
        <form [formGroup]="form" (ngSubmit)="submit()" class="stack-form">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password" type="password">
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">Login</button>
        </form>
        <div class="auth-join">
          <div>
            <strong>New to PetSense AI?</strong>
            <span>Create a secure workspace for your pet's health, nutrition, and daily progress.</span>
          </div>
          <a mat-stroked-button routerLink="/register">Create an account</a>
        </div>
      </section>
    </main>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (response) => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const target = returnUrl === '/admin' && !response.roles.includes('Admin')
          ? '/dashboard'
          : returnUrl || (response.roles.includes('Admin') ? '/admin' : '/dashboard');
        void this.router.navigateByUrl(target);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Login failed. Check your email and password.', 'Close', { duration: 3500 });
      }
    });
  }
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <main class="auth-page">
      <section class="auth-panel register-panel">
        <a class="brand" routerLink="/"><span class="brand-mark">P</span><span>PetSense AI</span></a>
        <h1>Create your account</h1>
        <p>Start building complete care profiles for your pets.</p>
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid-form">
          <mat-form-field appearance="outline">
            <mat-label>First name</mat-label>
            <input matInput formControlName="firstName">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Last name</mat-label>
            <input matInput formControlName="lastName">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password" type="password">
            @if (form.controls.password.hasError('required')) {
              <mat-error>Password is required.</mat-error>
            } @else if (form.controls.password.hasError('minlength') || form.controls.password.hasError('passwordStrength')) {
              <mat-error>Use 8+ characters with uppercase, lowercase, and a number.</mat-error>
            }
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">Create Account</button>
        </form>
        <div class="auth-join">
          <div>
            <strong>Already have an account?</strong>
            <span>Sign in to continue managing your pet care workspace.</span>
          </div>
          <a mat-stroked-button routerLink="/login">Login</a>
        </div>
      </section>
    </main>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
    password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.snackBar.open(getRegistrationErrorMessage(error), 'Close', { duration: 4500 });
      }
    });
  }
}

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const password = String(control.value ?? '');
  if (!password) {
    return null;
  }

  return /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)
    ? null
    : { passwordStrength: true };
}

function getRegistrationErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0 || error.status === 404) {
    return 'Registration service is unavailable. Please try again soon.';
  }

  const body = error.error as { message?: string; errors?: { errorMessage?: string }[] } | null;
  const validationErrors = body?.errors?.map((item) => item.errorMessage).filter(Boolean) ?? [];

  if (validationErrors.length > 0) {
    return validationErrors.join(' ');
  }

  return body?.message || 'Registration failed. Please check your details and try again.';
}
