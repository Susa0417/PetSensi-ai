import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import {
  AiInsight,
  Appointment,
  DailyProgressCharts,
  DailyProgressLog,
  DailyProgressSummary,
  HealthLog,
  MedicationReminder,
  NutritionPlan,
  PetProfile,
  ProgressChartPoint
} from '../../core/models';
import { SHARED_IMPORTS } from '../../shared/ui';

function todayForInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIso(): string {
  return new Date().toISOString();
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [SHARED_IMPORTS, RouterLink],
  template: `
    <section class="page-surface dashboard-overview-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Complete Care Overview</p>
          <h1>Health, nutrition, progress, and daily care</h1>
        </div>
        <a mat-flat-button color="primary" routerLink="/dashboard/nutrition"><mat-icon>restaurant</mat-icon>Create Nutrition Plan</a>
      </div>

      <div class="dashboard-card-grid">
        @for (card of cards(); track card.title) {
          <a class="dashboard-card" [routerLink]="card.route">
            <mat-icon>{{ card.icon }}</mat-icon>
            <span>{{ card.kicker }}</span>
            <strong>{{ card.value }}</strong>
            <p>{{ card.title }}</p>
          </a>
        }
      </div>
    </section>
  `
})
export class DashboardHomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly pets = signal<PetProfile[]>([]);
  readonly health = signal<HealthLog[]>([]);
  readonly nutrition = signal<NutritionPlan[]>([]);
  readonly progress = signal<DailyProgressLog[]>([]);
  readonly appointments = signal<Appointment[]>([]);
  readonly medications = signal<MedicationReminder[]>([]);
  readonly insights = signal<AiInsight[]>([]);
  readonly cards = computed(() => {
    const latestProgress = this.progress()[0];
    const latestHealth = this.health()[0];
    const wellness = latestProgress?.wellnessScore ?? latestHealth?.wellnessScore ?? 0;
    const upcoming = this.appointments().filter((item) => new Date(item.scheduledAt) >= new Date()).length;
    const activeMeds = this.medications().filter((item) => item.status === 'Active').length;

    return [
      { title: 'Complete Care Overview', kicker: 'Pets tracked', value: String(this.pets().length), icon: 'dashboard', route: '/dashboard/pets' },
      { title: 'Health Tracking', kicker: 'Health logs', value: String(this.health().length), icon: 'monitor_heart', route: '/dashboard/health' },
      { title: 'Nutrition Plan', kicker: 'Saved plans', value: String(this.nutrition().length), icon: 'restaurant', route: '/dashboard/nutrition' },
      { title: 'Daily Progress', kicker: 'Progress logs', value: String(this.progress().length), icon: 'trending_up', route: '/dashboard/daily-progress' },
      { title: 'Wellness Score', kicker: 'Latest score', value: wellness ? `${wellness}/100` : 'N/A', icon: 'favorite', route: '/dashboard/daily-progress' },
      { title: 'Upcoming Appointments', kicker: 'Scheduled', value: String(upcoming), icon: 'event_available', route: '/dashboard/appointments' },
      { title: 'Medication Reminders', kicker: 'Active', value: String(activeMeds), icon: 'medication', route: '/dashboard/medications' },
      { title: 'AI Recommendations', kicker: 'Insights', value: String(this.insights().length), icon: 'auto_awesome', route: '/dashboard/insights' }
    ];
  });

  ngOnInit(): void {
    forkJoin({
      pets: this.api.list<PetProfile>('pets'),
      health: this.api.list<HealthLog>('health-logs'),
      nutrition: this.api.list<NutritionPlan>('nutrition-plans'),
      progress: this.api.list<DailyProgressLog>('daily-progress'),
      appointments: this.api.list<Appointment>('appointments'),
      medications: this.api.list<MedicationReminder>('medication-reminders'),
      insights: this.api.list<AiInsight>('ai-insights')
    }).subscribe((result) => {
      this.pets.set(result.pets.items);
      this.health.set(result.health.items);
      this.nutrition.set(result.nutrition.items);
      this.progress.set(result.progress.items);
      this.appointments.set(result.appointments.items);
      this.medications.set(result.medications.items);
      this.insights.set(result.insights.items);
    });
  }
}

@Component({
  selector: 'app-nutrition-plan',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading">
        <div><p class="eyebrow">Nutrition Plan</p><h1>Personalized food and wellness guidance</h1></div>
        <button mat-flat-button color="primary" type="button" (click)="generate()" [disabled]="form.invalid || loading()"><mat-icon>auto_awesome</mat-icon>Generate Plan</button>
      </div>

      <div class="portal-grid two-column">
        <form class="panel-form" [formGroup]="form" (ngSubmit)="save()">
          <h2>{{ editingId() ? 'Edit nutrition plan' : 'Create nutrition plan' }}</h2>
          <div class="grid-form">
            <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select formControlName="petProfileId" (selectionChange)="syncPet($event.value)">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Pet type</mat-label><input matInput formControlName="petType"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Breed</mat-label><input matInput formControlName="breed"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Age</mat-label><input matInput type="number" formControlName="age"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Weight</mat-label><input matInput type="number" formControlName="weight"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Activity level</mat-label><mat-select formControlName="activityLevel"><mat-option value="Low">Low</mat-option><mat-option value="Moderate">Moderate</mat-option><mat-option value="High">High</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Current food</mat-label><input matInput formControlName="currentFood"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Feeding schedule</mat-label><input matInput formControlName="feedingSchedule"></mat-form-field>
            <mat-form-field appearance="outline" class="full-field"><mat-label>Allergies</mat-label><textarea matInput rows="2" formControlName="allergies"></textarea></mat-form-field>
            <mat-form-field appearance="outline" class="full-field"><mat-label>Medical conditions</mat-label><textarea matInput rows="2" formControlName="medicalConditions"></textarea></mat-form-field>
            <mat-form-field appearance="outline" class="full-field"><mat-label>Health goal</mat-label><textarea matInput rows="2" formControlName="healthGoal"></textarea></mat-form-field>
          </div>
          <div class="button-row">
            <button mat-stroked-button type="submit" [disabled]="form.invalid">{{ editingId() ? 'Update Plan' : 'Save Draft' }}</button>
            <button mat-flat-button color="primary" type="button" (click)="generate()" [disabled]="form.invalid || loading()">Generate Nutrition Plan</button>
            <button mat-stroked-button type="button" (click)="reset()">New</button>
          </div>
        </form>

        <div class="panel-list">
          <h2>Saved nutrition plans</h2>
          @for (plan of plans(); track plan.id) {
            <article class="nutrition-plan-card">
              <div>
                <span>{{ plan.petType }} - {{ plan.activityLevel }}</span>
                <strong>{{ plan.healthGoal }}</strong>
                <p>{{ plan.recommendedFoodType || 'Draft plan waiting for generation.' }}</p>
              </div>
              <div class="row-actions">
                <button mat-icon-button matTooltip="Edit" (click)="edit(plan)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button matTooltip="Regenerate" (click)="regenerate(plan)"><mat-icon>autorenew</mat-icon></button>
                <button mat-icon-button matTooltip="Delete" (click)="delete(plan.id)"><mat-icon>delete</mat-icon></button>
              </div>
            </article>
          }
        </div>
      </div>

      @if (selectedPlan()) {
        <div class="records-zone generated-plan">
          <div class="section-heading">
            <p class="eyebrow">Generated Plan</p>
            <h2>{{ selectedPlan()!.recommendedFoodType }}</h2>
          </div>
          <div class="grid feature-grid">
            @for (item of selectedPlan()!.items; track item.id || item.name) {
              <article class="feature-card">
                <mat-icon>{{ nutritionIcon(item.category) }}</mat-icon>
                <h3>{{ item.name }}</h3>
                <p>{{ item.recommendation }}</p>
              </article>
            }
          </div>
        </div>
      }
    </section>
  `
})
export class NutritionPlanComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly pets = signal<PetProfile[]>([]);
  readonly plans = signal<NutritionPlan[]>([]);
  readonly selectedPlan = signal<NutritionPlan | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    petProfileId: ['', Validators.required],
    petType: ['Dog', Validators.required],
    breed: ['', Validators.required],
    age: [1, [Validators.required, Validators.min(0)]],
    weight: [1, [Validators.required, Validators.min(0)]],
    allergies: [''],
    medicalConditions: [''],
    activityLevel: ['Moderate'],
    currentFood: [''],
    feedingSchedule: ['Morning and evening'],
    healthGoal: ['Maintain healthy weight', Validators.required]
  });

  ngOnInit(): void {
    this.loadPets();
    this.loadPlans();
  }

  loadPets(): void {
    this.api.list<PetProfile>('pets').subscribe((result) => {
      this.pets.set(result.items);
      if (result.items[0] && !this.form.controls.petProfileId.value) {
        this.form.patchValue({ petProfileId: result.items[0].id });
        this.syncPet(result.items[0].id);
      }
    });
  }

  loadPlans(): void {
    this.api.list<NutritionPlan>('nutrition-plans').subscribe((result) => {
      this.plans.set(result.items);
      this.selectedPlan.set(result.items[0] ?? null);
    });
  }

  syncPet(petId: string): void {
    const pet = this.pets().find((item) => item.id === petId);
    if (!pet) {
      return;
    }

    this.form.patchValue({
      petProfileId: pet.id,
      petType: pet.species,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      allergies: pet.allergies,
      medicalConditions: pet.medicalHistory
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.planPayload();
    const request: Observable<unknown> = this.editingId()
      ? this.api.update<NutritionPlan>('nutrition-plans', { ...(payload as NutritionPlan), id: this.editingId()! })
      : this.api.create<NutritionPlan>('nutrition-plans', payload);

    request.subscribe(() => {
      this.snackBar.open('Nutrition plan saved.', 'Close', { duration: 2500 });
      this.reset();
      this.loadPlans();
    });
  }

  generate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.api.generateNutritionPlan({ ...this.planPayload(), nutritionPlanId: this.editingId() }).subscribe({
      next: (plan) => {
        this.loading.set(false);
        this.selectedPlan.set(plan);
        this.editingId.set(plan.id);
        this.snackBar.open('Nutrition plan generated and saved.', 'Close', { duration: 3000 });
        this.loadPlans();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Nutrition plan could not be generated.', 'Close', { duration: 3500 });
      }
    });
  }

  edit(plan: NutritionPlan): void {
    this.editingId.set(plan.id);
    this.selectedPlan.set(plan);
    this.form.patchValue({
      petProfileId: plan.petProfileId,
      petType: plan.petType,
      breed: plan.breed,
      age: plan.age,
      weight: plan.weight,
      allergies: plan.allergies,
      medicalConditions: plan.medicalConditions,
      activityLevel: plan.activityLevel,
      currentFood: plan.currentFood,
      feedingSchedule: plan.feedingSchedule,
      healthGoal: plan.healthGoal
    });
  }

  regenerate(plan: NutritionPlan): void {
    this.edit(plan);
    this.generate();
  }

  delete(id: string): void {
    this.api.delete('nutrition-plans', id).subscribe(() => {
      this.snackBar.open('Nutrition plan deleted.', 'Close', { duration: 2500 });
      this.reset();
      this.loadPlans();
    });
  }

  reset(): void {
    const petId = this.form.controls.petProfileId.value || this.pets()[0]?.id || '';
    this.editingId.set(null);
    this.selectedPlan.set(null);
    this.form.reset({
      petProfileId: petId,
      petType: 'Dog',
      breed: '',
      age: 1,
      weight: 1,
      allergies: '',
      medicalConditions: '',
      activityLevel: 'Moderate',
      currentFood: '',
      feedingSchedule: 'Morning and evening',
      healthGoal: 'Maintain healthy weight'
    });
    if (petId) {
      this.syncPet(petId);
    }
  }

  planPayload(): Partial<NutritionPlan> {
    return {
      ...this.form.getRawValue(),
      recommendedFoodType: this.selectedPlan()?.recommendedFoodType ?? '',
      mealFrequency: this.selectedPlan()?.mealFrequency ?? '',
      portionSuggestion: this.selectedPlan()?.portionSuggestion ?? '',
      hydrationReminder: this.selectedPlan()?.hydrationReminder ?? '',
      foodsToAvoid: this.selectedPlan()?.foodsToAvoid ?? '',
      allergyNotes: this.selectedPlan()?.allergyNotes ?? '',
      healthGoalGuidance: this.selectedPlan()?.healthGoalGuidance ?? ''
    };
  }

  nutritionIcon(category: string): string {
    const value = category.toLowerCase();
    if (value.includes('food')) return 'restaurant';
    if (value.includes('schedule')) return 'schedule';
    if (value.includes('hydration')) return 'water_drop';
    if (value.includes('safety')) return 'warning';
    if (value.includes('goal')) return 'flag';
    return 'pets';
  }
}

@Component({
  selector: 'app-daily-progress',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading">
        <div><p class="eyebrow">Daily Progress</p><h1>Wellness trends and daily care progress</h1></div>
        <button mat-stroked-button type="button" (click)="reset()"><mat-icon>add</mat-icon>New Progress Log</button>
      </div>

      <div class="portal-grid two-column">
        <form class="panel-form" [formGroup]="form" (ngSubmit)="save()">
          <h2>{{ editingId() ? 'Edit progress log' : 'Add daily progress log' }}</h2>
          <div class="grid-form">
            <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select formControlName="petProfileId" (selectionChange)="selectPet($event.value)">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Date</mat-label><input matInput type="date" formControlName="logDate"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Weight</mat-label><input matInput type="number" formControlName="weight"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Wellness score</mat-label><input matInput type="number" min="0" max="100" formControlName="wellnessScore"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Mood</mat-label><input matInput formControlName="mood"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Activity level</mat-label><mat-select formControlName="activityLevel"><mat-option value="Low">Low</mat-option><mat-option value="Moderate">Moderate</mat-option><mat-option value="High">High</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Sleep hours</mat-label><input matInput type="number" formControlName="sleepHours"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Food intake</mat-label><input matInput formControlName="foodIntake"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Water intake</mat-label><input matInput formControlName="waterIntake"></mat-form-field>
            <mat-checkbox formControlName="medicationTaken">Medication taken</mat-checkbox>
            <mat-form-field appearance="outline" class="full-field"><mat-label>Symptoms</mat-label><textarea matInput rows="2" formControlName="symptoms"></textarea></mat-form-field>
            <mat-form-field appearance="outline" class="full-field"><mat-label>Training progress</mat-label><textarea matInput rows="2" formControlName="trainingProgress"></textarea></mat-form-field>
            <mat-form-field appearance="outline" class="full-field"><mat-label>Notes</mat-label><textarea matInput rows="3" formControlName="notes"></textarea></mat-form-field>
          </div>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">{{ editingId() ? 'Update Progress' : 'Save Progress' }}</button>
        </form>

        <div class="analytics-panel">
          <h2>Wellness trend</h2>
          <svg viewBox="0 0 320 150" class="wellness-chart" role="img" aria-label="Daily wellness chart">
            <polyline [attr.points]="chartPoints(charts()?.daily ?? [])" />
          </svg>
          @if (summary()) {
            <div class="score-summary">
              <span>Latest / Average</span>
              <strong>{{ summary()!.latestWellnessScore || 0 }} / {{ summary()!.averageWellnessScore || 0 }}</strong>
            </div>
            <div class="progress-flags">
              @for (item of summary()!.improvements; track item) {
                <span class="positive"><mat-icon>trending_up</mat-icon>{{ item }}</span>
              }
              @for (item of summary()!.warnings; track item) {
                <span class="warning"><mat-icon>warning</mat-icon>{{ item }}</span>
              }
            </div>
          }
        </div>
      </div>

      <div class="portal-grid two-column records-zone">
        <div class="analytics-panel">
          <h2>Weekly and monthly progress</h2>
          <mat-tab-group>
            <mat-tab label="Daily"><svg viewBox="0 0 320 150" class="wellness-chart"><polyline [attr.points]="chartPoints(charts()?.daily ?? [])" /></svg></mat-tab>
            <mat-tab label="Weekly"><svg viewBox="0 0 320 150" class="wellness-chart"><polyline [attr.points]="chartPoints(charts()?.weekly ?? [])" /></svg></mat-tab>
            <mat-tab label="Monthly"><svg viewBox="0 0 320 150" class="wellness-chart"><polyline [attr.points]="chartPoints(charts()?.monthly ?? [])" /></svg></mat-tab>
            <mat-tab label="Weight"><svg viewBox="0 0 320 150" class="wellness-chart"><polyline [attr.points]="chartPoints(charts()?.weight ?? [])" /></svg></mat-tab>
          </mat-tab-group>
        </div>
        <div class="panel-list">
          <h2>Recent progress logs</h2>
          @for (log of logs(); track log.id) {
            <article class="log-row">
              <strong>{{ log.logDate | date:'mediumDate' }} - Score {{ log.wellnessScore }}</strong>
              <span>{{ log.mood }} mood - {{ log.activityLevel }} activity - {{ log.sleepHours }} hrs sleep</span>
              <p>{{ log.symptoms || log.notes || log.trainingProgress || 'No notes' }}</p>
              <div class="row-actions">
                <button mat-icon-button matTooltip="Edit" (click)="edit(log)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button matTooltip="Delete" (click)="delete(log.id)"><mat-icon>delete</mat-icon></button>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class DailyProgressComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly pets = signal<PetProfile[]>([]);
  readonly logs = signal<DailyProgressLog[]>([]);
  readonly summary = signal<DailyProgressSummary | null>(null);
  readonly charts = signal<DailyProgressCharts | null>(null);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    petProfileId: ['', Validators.required],
    logDate: [todayForInput(), Validators.required],
    weight: [0],
    mood: ['Calm'],
    activityLevel: ['Moderate'],
    sleepHours: [8, [Validators.required, Validators.min(0)]],
    foodIntake: ['Normal'],
    waterIntake: ['Good'],
    symptoms: [''],
    medicationTaken: [false],
    trainingProgress: [''],
    notes: [''],
    wellnessScore: [80, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  ngOnInit(): void {
    this.api.list<PetProfile>('pets').subscribe((result) => {
      this.pets.set(result.items);
      const pet = result.items[0];
      if (pet) {
        this.form.patchValue({ petProfileId: pet.id, weight: pet.weight });
        this.refreshForPet(pet.id);
      }
    });
    this.loadLogs();
  }

  selectPet(petId: string): void {
    const pet = this.pets().find((item) => item.id === petId);
    if (pet) {
      this.form.patchValue({ weight: pet.weight });
    }
    this.refreshForPet(petId);
  }

  loadLogs(): void {
    this.api.list<DailyProgressLog>('daily-progress').subscribe((result) => this.logs.set(result.items));
  }

  refreshForPet(petId: string): void {
    if (!petId) {
      return;
    }
    this.api.dailyProgressSummary(petId).subscribe((summary) => this.summary.set(summary));
    this.api.dailyProgressCharts(petId).subscribe((charts) => this.charts.set(charts));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.normalizedPayload();
    const request: Observable<unknown> = this.editingId()
      ? this.api.update<DailyProgressLog>('daily-progress', { ...(value as DailyProgressLog), id: this.editingId()! })
      : this.api.create<DailyProgressLog>('daily-progress', value);

    request.subscribe(() => {
      this.snackBar.open(this.editingId() ? 'Daily progress updated.' : 'Daily progress saved.', 'Close', { duration: 2500 });
      const petId = this.form.controls.petProfileId.value;
      this.reset();
      this.loadLogs();
      this.refreshForPet(petId);
    });
  }

  edit(log: DailyProgressLog): void {
    this.editingId.set(log.id);
    this.form.patchValue({
      ...log,
      logDate: log.logDate.slice(0, 10),
      weight: log.weight ?? 0
    });
  }

  delete(id: string): void {
    this.api.delete('daily-progress', id).subscribe(() => {
      this.snackBar.open('Daily progress log deleted.', 'Close', { duration: 2500 });
      const petId = this.form.controls.petProfileId.value;
      this.loadLogs();
      this.refreshForPet(petId);
    });
  }

  reset(): void {
    const petId = this.form.controls.petProfileId.value || this.pets()[0]?.id || '';
    const pet = this.pets().find((item) => item.id === petId);
    this.editingId.set(null);
    this.form.reset({
      petProfileId: petId,
      logDate: todayForInput(),
      weight: pet?.weight ?? 0,
      mood: 'Calm',
      activityLevel: 'Moderate',
      sleepHours: 8,
      foodIntake: 'Normal',
      waterIntake: 'Good',
      symptoms: '',
      medicationTaken: false,
      trainingProgress: '',
      notes: '',
      wellnessScore: 80
    });
  }

  normalizedPayload(): Partial<DailyProgressLog> {
    const value = this.form.getRawValue();
    return {
      ...value,
      logDate: `${value.logDate}T12:00:00`
    };
  }

  chartPoints(points: ProgressChartPoint[]): string {
    if (!points.length) {
      return '';
    }

    const max = Math.max(100, ...points.map((point) => point.value));
    return points.map((point, index) => {
      const x = points.length <= 1 ? 24 : 24 + (index * 272) / (points.length - 1);
      const y = 126 - (Math.max(0, point.value) / max) * 102;
      return `${x},${y}`;
    }).join(' ');
  }
}
