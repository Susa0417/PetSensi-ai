import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import {
  AiInsight,
  PetProfile,
  WorkflowAnalysis,
  WorkflowProgress,
  WorkflowStatus
} from '../../core/models';
import { SHARED_IMPORTS } from '../../shared/ui';

interface WorkflowNavStep {
  key: string;
  title: string;
  route: string;
}

const WORKFLOW_STEPS: WorkflowNavStep[] = [
  { key: 'profile', title: 'Create Your Pet Profile', route: '/dashboard/workflow/profile' },
  { key: 'daily-log', title: 'Log 1: Behavior and Health Updates', route: '/dashboard/workflow/daily-log' },
  { key: 'analysis', title: 'Log 2: Pattern Analyzing AI Site', route: '/dashboard/workflow/analysis' },
  { key: 'insights', title: 'Log 3: Insight and Recommendation', route: '/dashboard/workflow/insights' },
  { key: 'progress', title: 'Log 4: Tracker for Overall Progress', route: '/dashboard/workflow/progress' }
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowLocal(): string {
  return new Date().toISOString().slice(0, 16);
}

@Component({
  selector: 'app-workflow-status',
  standalone: true,
  imports: [SHARED_IMPORTS, RouterLink],
  template: `
    <div class="workflow-status">
      @for (step of steps; track step.key; let index = $index) {
        <a [routerLink]="step.route" class="workflow-status-step" [class.active]="step.key === active">
          <span>{{ index + 1 }}</span>
          <strong>{{ step.title }}</strong>
          <small [class]="statusClass(step.key)">{{ statusText(step.key) }}</small>
        </a>
      }
    </div>
  `
})
export class WorkflowStatusComponent {
  @Input({ required: true }) active = '';
  @Input() status: WorkflowStatus | null = null;
  readonly steps = WORKFLOW_STEPS;

  statusText(key: string): string {
    return this.status?.steps.find((step) => step.key === key)?.status ?? 'pending';
  }

  statusClass(key: string): string {
    return `workflow-state ${this.statusText(key).replace(' ', '-')}`;
  }
}

@Component({
  selector: 'app-workflow-profile',
  standalone: true,
  imports: [SHARED_IMPORTS, WorkflowStatusComponent],
  template: `
    <section class="page-surface workflow-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Step 1</p>
          <h1>Create Your Pet Profile</h1>
        </div>
        <button mat-stroked-button routerLink="/dashboard/pets"><mat-icon>pets</mat-icon>User Dashboard</button>
      </div>
      <app-workflow-status active="profile" [status]="status()" />

      <div class="portal-grid two-column workflow-main">
        <form class="panel-form" [formGroup]="form" (ngSubmit)="save()">
          <h2>Pet profile details</h2>
          <div class="grid-form">
            <mat-form-field appearance="outline"><mat-label>Pet name</mat-label><input matInput formControlName="name"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Species</mat-label><mat-select formControlName="species"><mat-option value="Dog">Dog</mat-option><mat-option value="Cat">Cat</mat-option><mat-option value="Other">Other</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Age</mat-label><input matInput type="number" formControlName="age"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Breed</mat-label><input matInput formControlName="breed"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Gender</mat-label><mat-select formControlName="gender"><mat-option value="Female">Female</mat-option><mat-option value="Male">Male</mat-option><mat-option value="Unknown">Unknown</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Weight</mat-label><input matInput type="number" formControlName="weight"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Vet name</mat-label><input matInput formControlName="vetName"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Vet phone</mat-label><input matInput formControlName="vetPhone"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Vaccine name</mat-label><input matInput formControlName="vaccineName"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Vaccine due date</mat-label><input matInput type="date" formControlName="vaccineDueDate"></mat-form-field>
            <mat-form-field appearance="outline" class="full-field"><mat-label>Allergies</mat-label><textarea matInput rows="2" formControlName="allergies"></textarea></mat-form-field>
            <mat-form-field appearance="outline" class="full-field"><mat-label>Medical history</mat-label><textarea matInput rows="3" formControlName="medicalHistory"></textarea></mat-form-field>
            <label class="upload-drop full-field">
              <mat-icon>add_photo_alternate</mat-icon>
              <span>{{ form.controls.photoUrl.value ? 'Photo uploaded' : 'Upload pet photo' }}</span>
              <input type="file" accept="image/*" (change)="uploadPhoto($event)">
            </label>
          </div>
          <div class="button-row">
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">Save Pet Profile</button>
            @if (saved()) {
              <button mat-stroked-button type="button" (click)="goNext()">Next Step<mat-icon>arrow_forward</mat-icon></button>
            }
          </div>
        </form>

        <div class="panel-list">
          <h2>Saved pet profiles</h2>
          @for (pet of pets(); track pet.id) {
            <article class="pet-row">
              <div><strong>{{ pet.name }}</strong><span>{{ pet.breed }} - {{ pet.age }} yrs - {{ pet.weight }} lbs</span></div>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class WorkflowProfileComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly status = signal<WorkflowStatus | null>(null);
  readonly pets = signal<PetProfile[]>([]);
  readonly loading = signal(false);
  readonly saved = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    species: ['Dog', Validators.required],
    breed: ['', Validators.required],
    age: [1, [Validators.required, Validators.min(0)]],
    weight: [1, [Validators.required, Validators.min(0)]],
    gender: ['Unknown'],
    photoUrl: [''],
    allergies: [''],
    medicalHistory: [''],
    vetName: [''],
    vetPhone: [''],
    vaccineName: [''],
    vaccineGivenDate: [today()],
    vaccineDueDate: [''],
    vaccineLotNumber: [''],
    vaccineNotes: ['']
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.api.workflowStatus().subscribe((status) => this.status.set(status));
    this.api.workflowPets().subscribe((pets) => this.pets.set(pets));
  }

  uploadPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    this.api.uploadMedia(file, 'pet-photo', file.name).subscribe({
      next: (media) => {
        this.form.patchValue({ photoUrl: media.url });
        this.snackBar.open('Pet photo uploaded.', 'Close', { duration: 2500 });
      },
      error: () => this.snackBar.open('Photo upload failed.', 'Close', { duration: 3500 })
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.api.create<PetProfile>('workflow/pet-profile', this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.saved.set(true);
        this.snackBar.open('Pet profile saved to the database.', 'Close', { duration: 3000 });
        this.refresh();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Pet profile could not be saved.', 'Close', { duration: 4000 });
      }
    });
  }

  goNext(): void {
    void this.router.navigateByUrl('/dashboard/workflow/daily-log');
  }
}

@Component({
  selector: 'app-workflow-daily-log',
  standalone: true,
  imports: [SHARED_IMPORTS, WorkflowStatusComponent],
  template: `
    <section class="page-surface workflow-page">
      <div class="page-heading"><div><p class="eyebrow">Step 2</p><h1>Log 1: Behavior and Health Updates</h1></div></div>
      <app-workflow-status active="daily-log" [status]="status()" />

      <form class="panel-form workflow-main" [formGroup]="form" (ngSubmit)="save()">
        <div class="grid-form">
          <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select formControlName="petProfileId">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Date</mat-label><input matInput type="datetime-local" formControlName="logDate"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Eating habit</mat-label><input matInput formControlName="eatingHabit"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Sleeping pattern</mat-label><input matInput formControlName="sleepingPattern"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Mood</mat-label><input matInput formControlName="mood"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Activity level</mat-label><input matInput formControlName="activityLevel"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Bathroom habit</mat-label><input matInput formControlName="bathroomHabit"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Hydration</mat-label><input matInput formControlName="hydration"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Weight</mat-label><input matInput type="number" formControlName="weight"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Wellness score</mat-label><input matInput type="number" min="0" max="100" formControlName="wellnessScore"></mat-form-field>
          <mat-form-field appearance="outline" class="full-field"><mat-label>Symptoms</mat-label><textarea matInput rows="2" formControlName="symptoms"></textarea></mat-form-field>
          <mat-form-field appearance="outline" class="full-field"><mat-label>Unusual behavior</mat-label><textarea matInput rows="2" formControlName="unusualBehavior"></textarea></mat-form-field>
          <mat-form-field appearance="outline" class="full-field"><mat-label>Behavior notes</mat-label><textarea matInput rows="3" formControlName="behaviorNotes"></textarea></mat-form-field>
          <mat-form-field appearance="outline" class="full-field"><mat-label>Health notes</mat-label><textarea matInput rows="3" formControlName="healthNotes"></textarea></mat-form-field>
        </div>
        <div class="button-row">
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">Save Daily Log</button>
          @if (saved()) {
            <button mat-stroked-button type="button" (click)="goNext()">Next Step<mat-icon>arrow_forward</mat-icon></button>
          }
        </div>
      </form>
    </section>
  `
})
export class WorkflowDailyLogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly status = signal<WorkflowStatus | null>(null);
  readonly pets = signal<PetProfile[]>([]);
  readonly loading = signal(false);
  readonly saved = signal(false);

  readonly form = this.fb.nonNullable.group({
    petProfileId: ['', Validators.required],
    logDate: [nowLocal(), Validators.required],
    eatingHabit: ['Normal'],
    sleepingPattern: ['Normal'],
    mood: ['Calm'],
    activityLevel: ['Moderate'],
    bathroomHabit: ['Normal'],
    symptoms: [''],
    unusualBehavior: [''],
    behaviorNotes: [''],
    healthNotes: [''],
    hydration: ['Good'],
    weight: [0],
    wellnessScore: [80, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  ngOnInit(): void {
    this.api.workflowStatus().subscribe((status) => this.status.set(status));
    this.api.workflowPets().subscribe((pets) => {
      this.pets.set(pets);
      if (pets[0]) {
        this.form.patchValue({ petProfileId: pets[0].id, weight: pets[0].weight });
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.api.create('workflow/daily-log', this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.saved.set(true);
        this.snackBar.open('Behavior and health logs saved.', 'Close', { duration: 3000 });
        this.api.workflowStatus().subscribe((status) => this.status.set(status));
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Daily log could not be saved.', 'Close', { duration: 4000 });
      }
    });
  }

  goNext(): void {
    void this.router.navigateByUrl('/dashboard/workflow/analysis');
  }
}

@Component({
  selector: 'app-workflow-analysis',
  standalone: true,
  imports: [SHARED_IMPORTS, WorkflowStatusComponent],
  template: `
    <section class="page-surface workflow-page">
      <div class="page-heading"><div><p class="eyebrow">Step 3</p><h1>Log 2: Pattern Analyzing AI Site</h1></div></div>
      <app-workflow-status active="analysis" [status]="status()" />

      <div class="panel-form workflow-main">
        <div class="grid-form">
          <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select [value]="selectedPetId()" (selectionChange)="selectPet($event.value)">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
          <button mat-flat-button color="primary" type="button" (click)="analyze()" [disabled]="!selectedPetId() || loading()"><mat-icon>psychology</mat-icon>Analyze Patterns</button>
        </div>
      </div>

      @if (analysis()) {
        <div class="insight-grid workflow-main">
          @for (finding of analysis()!.findings; track finding.title) {
            <article class="insight-card" [class.high]="finding.status === 'Needs attention'" [class.medium]="finding.status === 'Pending'">
              <span>{{ finding.status }}</span>
              <h2>{{ finding.title }}</h2>
              <p>{{ finding.detail }}</p>
            </article>
          }
        </div>
        <div class="button-row workflow-next">
          <button mat-stroked-button type="button" (click)="goNext()">Next Step<mat-icon>arrow_forward</mat-icon></button>
        </div>
      }
    </section>
  `
})
export class WorkflowAnalysisComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly status = signal<WorkflowStatus | null>(null);
  readonly pets = signal<PetProfile[]>([]);
  readonly selectedPetId = signal('');
  readonly analysis = signal<WorkflowAnalysis | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.api.workflowStatus().subscribe((status) => this.status.set(status));
    this.api.workflowPets().subscribe((pets) => {
      this.pets.set(pets);
      this.selectedPetId.set(pets[0]?.id ?? '');
      if (pets[0]) {
        this.analyze();
      }
    });
  }

  selectPet(petId: string): void {
    this.selectedPetId.set(petId);
    this.analysis.set(null);
  }

  analyze(): void {
    const petId = this.selectedPetId();
    if (!petId) {
      return;
    }

    this.loading.set(true);
    this.api.workflowAnalysis(petId).subscribe({
      next: (analysis) => {
        this.loading.set(false);
        this.analysis.set(analysis);
        this.api.workflowStatus().subscribe((status) => this.status.set(status));
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Pattern analysis could not be generated.', 'Close', { duration: 4000 });
      }
    });
  }

  goNext(): void {
    void this.router.navigateByUrl('/dashboard/workflow/insights');
  }
}

@Component({
  selector: 'app-workflow-insights',
  standalone: true,
  imports: [SHARED_IMPORTS, WorkflowStatusComponent],
  template: `
    <section class="page-surface workflow-page">
      <div class="page-heading"><div><p class="eyebrow">Step 4</p><h1>Log 3: Insight and Recommendation</h1></div></div>
      <app-workflow-status active="insights" [status]="status()" />

      <div class="panel-form workflow-main">
        <div class="grid-form">
          <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select [value]="selectedPetId()" (selectionChange)="selectedPetId.set($event.value)">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
          <button mat-flat-button color="primary" type="button" (click)="generate()" [disabled]="!selectedPetId() || loading()"><mat-icon>auto_awesome</mat-icon>Generate Insight</button>
        </div>
      </div>

      @if (insight()) {
        <article class="insight-card workflow-main" [class.high]="insight()!.riskLevel === 'High'" [class.medium]="insight()!.riskLevel === 'Medium'">
          <span>{{ insight()!.riskLevel }} Risk</span>
          <h2>{{ insight()!.title }}</h2>
          <p>{{ insight()!.recommendation }}</p>
          <strong>{{ insight()!.nextAction }}</strong>
          <small>{{ insight()!.sourceSummary }}</small>
        </article>
        <div class="button-row workflow-next">
          <button mat-stroked-button type="button" (click)="goNext()">Next Step<mat-icon>arrow_forward</mat-icon></button>
        </div>
      }
    </section>
  `
})
export class WorkflowInsightsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly status = signal<WorkflowStatus | null>(null);
  readonly pets = signal<PetProfile[]>([]);
  readonly selectedPetId = signal('');
  readonly insight = signal<AiInsight | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.api.workflowStatus().subscribe((status) => this.status.set(status));
    this.api.workflowPets().subscribe((pets) => {
      this.pets.set(pets);
      this.selectedPetId.set(pets[0]?.id ?? '');
    });
  }

  generate(): void {
    const petId = this.selectedPetId();
    if (!petId) {
      return;
    }

    this.loading.set(true);
    this.api.workflowInsight(petId).subscribe({
      next: (insight) => {
        this.loading.set(false);
        this.insight.set(insight);
        this.snackBar.open('Insight saved to the database.', 'Close', { duration: 3000 });
        this.api.workflowStatus().subscribe((status) => this.status.set(status));
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Insight could not be generated.', 'Close', { duration: 4000 });
      }
    });
  }

  goNext(): void {
    void this.router.navigateByUrl('/dashboard/workflow/progress');
  }
}

@Component({
  selector: 'app-workflow-progress',
  standalone: true,
  imports: [SHARED_IMPORTS, WorkflowStatusComponent],
  template: `
    <section class="page-surface workflow-page">
      <div class="page-heading"><div><p class="eyebrow">Step 5</p><h1>Log 4: Tracker for Overall Progress</h1></div></div>
      <app-workflow-status active="progress" [status]="status()" />

      <div class="panel-form workflow-main">
        <div class="grid-form">
          <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select [value]="selectedPetId()" (selectionChange)="selectedPetId.set($event.value)">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>From</mat-label><input matInput type="date" [value]="from()" (input)="from.set($any($event.target).value)"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>To</mat-label><input matInput type="date" [value]="to()" (input)="to.set($any($event.target).value)"></mat-form-field>
          <button mat-flat-button color="primary" type="button" (click)="loadProgress()" [disabled]="!selectedPetId() || loading()"><mat-icon>query_stats</mat-icon>Load Progress</button>
        </div>
      </div>

      @if (progress()) {
        <div class="portal-grid two-column workflow-main">
          <div class="analytics-panel">
            <h2>Wellness score</h2>
            <svg viewBox="0 0 320 150" class="wellness-chart"><polyline [attr.points]="chartPoints(progress()!.wellnessScore)" /></svg>
            <h2>Behavior trend</h2>
            <svg viewBox="0 0 320 150" class="wellness-chart"><polyline [attr.points]="chartPoints(progress()!.behaviorTrend)" /></svg>
          </div>
          <div class="panel-list">
            <h2>Medication completion</h2>
            <article class="log-row"><strong>{{ progress()!.medicationCompletion.complete }} complete</strong><span>{{ progress()!.medicationCompletion.active }} active of {{ progress()!.medicationCompletion.total }} total</span></article>
            <h2>Appointment history</h2>
            @for (item of progress()!.appointmentHistory; track item.date + item.title) {
              <article class="log-row"><strong>{{ item.title }}</strong><span>{{ item.date | date:'shortDate' }} - {{ item.status }}</span><p>{{ item.notes }}</p></article>
            }
            <h2>Vaccine status</h2>
            @for (vaccine of progress()!.vaccineStatus; track vaccine.vaccineName + vaccine.givenDate) {
              <article class="log-row"><strong>{{ vaccine.vaccineName }}</strong><span>{{ vaccine.status }} @if (vaccine.dueDate) { - Due {{ vaccine.dueDate | date:'shortDate' }} }</span></article>
            }
          </div>
        </div>
      }
    </section>
  `
})
export class WorkflowProgressComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  readonly status = signal<WorkflowStatus | null>(null);
  readonly pets = signal<PetProfile[]>([]);
  readonly selectedPetId = signal('');
  readonly from = signal(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  readonly to = signal(today());
  readonly progress = signal<WorkflowProgress | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.api.workflowStatus().subscribe((status) => this.status.set(status));
    this.api.workflowPets().subscribe((pets) => {
      this.pets.set(pets);
      this.selectedPetId.set(pets[0]?.id ?? '');
      if (pets[0]) {
        this.loadProgress();
      }
    });
  }

  loadProgress(): void {
    const petId = this.selectedPetId();
    if (!petId) {
      return;
    }

    this.loading.set(true);
    this.api.workflowProgress(petId, this.from(), this.to()).subscribe({
      next: (progress) => {
        this.loading.set(false);
        this.progress.set(progress);
        this.api.workflowStatus().subscribe((status) => this.status.set(status));
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Progress data could not be loaded.', 'Close', { duration: 4000 });
      }
    });
  }

  chartPoints(points: Array<{ value: number }>): string {
    if (!points.length) {
      return '';
    }

    return points.map((point, index) => {
      const x = points.length <= 1 ? 24 : 24 + (index * 272) / (points.length - 1);
      const y = 126 - Math.max(0, Math.min(100, point.value)) * 1.02;
      return `${x},${y}`;
    }).join(' ');
  }
}
