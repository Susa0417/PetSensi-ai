import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { SHARED_IMPORTS } from '../shared/ui';

const adminNav = [
  { path: '/admin/content', label: 'Website Content', icon: 'web' },
  { path: '/admin/contacts', label: 'Waitlist', icon: 'mark_email_read' },
  { path: '/admin/users', label: 'Users', icon: 'group' },
  { path: '/admin/training', label: 'Training Guides', icon: 'school' },
  { path: '/admin/media', label: 'Media', icon: 'perm_media' }
];

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="app-shell admin-shell">
      <aside class="sidebar admin-sidebar">
        <a class="brand" routerLink="/admin"><span class="brand-mark">P</span><span>PetSense AI</span></a>
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
            <strong>Admin Dashboard</strong>
            <span>{{ auth.current?.email }}</span>
          </div>
          <div class="topbar-actions">
            <a mat-stroked-button routerLink="/dashboard"><mat-icon>dashboard</mat-icon>User Portal</a>
            <a mat-stroked-button routerLink="/"><mat-icon>home</mat-icon>Website</a>
            <button mat-icon-button matTooltip="Logout" (click)="auth.logout()"><mat-icon>logout</mat-icon></button>
          </div>
        </header>
        <router-outlet />
      </section>
    </div>
  `
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  readonly nav = adminNav;
}
