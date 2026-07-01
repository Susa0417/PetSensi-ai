import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { SHARED_IMPORTS } from '../shared/ui';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const userNav: NavItem[] = [
  { path: '/dashboard', label: 'Overview', icon: 'dashboard' },
  { path: '/dashboard/pets', label: 'Pet Profile', icon: 'pets' },
  { path: '/dashboard/workflow/profile', label: 'Care Workflow', icon: 'account_tree' },
  { path: '/dashboard/nutrition', label: 'Nutrition Plan', icon: 'restaurant' },
  { path: '/dashboard/daily-progress', label: 'Daily Progress', icon: 'trending_up' },
  { path: '/dashboard/behavior', label: 'Behavior', icon: 'psychology' },
  { path: '/dashboard/health', label: 'Health', icon: 'monitor_heart' },
  { path: '/dashboard/medications', label: 'Medication', icon: 'medication' },
  { path: '/dashboard/appointments', label: 'Appointments', icon: 'event' },
  { path: '/dashboard/insights', label: 'AI Insights', icon: 'auto_awesome' },
  { path: '/dashboard/training', label: 'Training', icon: 'school' },
  { path: '/dashboard/reports', label: 'Reports', icon: 'query_stats' }
];

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/dashboard"><span class="brand-mark">P</span><span>PetSense AI</span></a>
        <nav class="side-nav">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active">
              <mat-icon>{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </aside>
      <section class="workspace">
        <header class="workspace-topbar">
          <div>
            <strong>User Portal</strong>
            <span>{{ auth.current?.email }}</span>
          </div>
          <div class="topbar-actions">
            @if (auth.hasRole('Admin')) {
              <a mat-stroked-button routerLink="/admin"><mat-icon>admin_panel_settings</mat-icon>Admin</a>
            }
            <button mat-icon-button matTooltip="Logout" (click)="auth.logout()"><mat-icon>logout</mat-icon></button>
          </div>
        </header>
        <router-outlet />
      </section>
    </div>
  `
})
export class DashboardLayoutComponent {
  readonly auth = inject(AuthService);
  readonly nav = userNav;
}
