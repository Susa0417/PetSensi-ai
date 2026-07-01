import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards';
import { PublicHomeComponent } from './pages/public/public-home.component';
import { LoginComponent, RegisterComponent } from './pages/auth/auth-pages.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout.component';
import {
  AppointmentsComponent,
  BehaviorComponent,
  HealthComponent,
  InsightsComponent,
  MedicationsComponent,
  PetsComponent,
  ReportsComponent,
  TrainingComponent
} from './pages/dashboard/dashboard-pages.component';
import {
  DailyProgressComponent,
  DashboardHomeComponent,
  NutritionPlanComponent
} from './pages/care/care-pages.component';
import {
  WorkflowAnalysisComponent,
  WorkflowDailyLogComponent,
  WorkflowInsightsComponent,
  WorkflowProfileComponent,
  WorkflowProgressComponent
} from './pages/workflow/workflow-pages.component';
import {
  AdminContentComponent,
  AdminContactsComponent,
  AdminMediaComponent,
  AdminTrainingComponent,
  AdminUsersComponent
} from './pages/admin/admin-pages.component';

export const routes: Routes = [
  { path: '', component: PublicHomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardHomeComponent },
      { path: 'pets', component: PetsComponent },
      { path: 'nutrition', component: NutritionPlanComponent },
      { path: 'daily-progress', component: DailyProgressComponent },
      { path: 'behavior', component: BehaviorComponent },
      { path: 'health', component: HealthComponent },
      { path: 'medications', component: MedicationsComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'insights', component: InsightsComponent },
      { path: 'training', component: TrainingComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'workflow', pathMatch: 'full', redirectTo: 'workflow/profile' },
      { path: 'workflow/profile', component: WorkflowProfileComponent },
      { path: 'workflow/daily-log', component: WorkflowDailyLogComponent },
      { path: 'workflow/analysis', component: WorkflowAnalysisComponent },
      { path: 'workflow/insights', component: WorkflowInsightsComponent },
      { path: 'workflow/progress', component: WorkflowProgressComponent }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'content' },
      { path: 'content', component: AdminContentComponent },
      { path: 'contacts', component: AdminContactsComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'training', component: AdminTrainingComponent },
      { path: 'media', component: AdminMediaComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
