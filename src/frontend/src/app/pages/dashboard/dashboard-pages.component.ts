import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import {
  AiInsight,
  Appointment,
  BehaviorLog,
  HealthLog,
  MedicalRecord,
  MedicationReminder,
  PetProfile,
  ProgressReport,
  TrainingGuide,
  VaccineRecord
} from '../../core/models';
import { SHARED_IMPORTS } from '../../shared/ui';

function nowForInput(): string {
  return new Date().toISOString().slice(0, 16);
}

function todayForInput(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-pets',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Pet Profile</p>
          <h1>Profiles, vaccines, and medical records</h1>
        </div>
        <button mat-stroked-button (click)="resetPetForm()"><mat-icon>add</mat-icon>New Pet</button>
      </div>

      <div class="portal-grid two-column">
        <form class="panel-form" [formGroup]="petForm" (ngSubmit)="savePet()">
          <h2>{{ editingPetId() ? 'Edit pet profile' : 'Create pet profile' }}</h2>
          <div class="grid-form">
            <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Species</mat-label><mat-select formControlName="species"><mat-option value="Dog">Dog</mat-option><mat-option value="Cat">Cat</mat-option><mat-option value="Other">Other</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Breed</mat-label><input matInput formControlName="breed"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Age</mat-label><input matInput type="number" formControlName="age"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Weight</mat-label><input matInput type="number" formControlName="weight"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Gender</mat-label><mat-select formControlName="gender"><mat-option value="Female">Female</mat-option><mat-option value="Male">Male</mat-option><mat-option value="Unknown">Unknown</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Allergies</mat-label><input matInput formControlName="allergies"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Vet name</mat-label><input matInput formControlName="vetName"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Vet phone</mat-label><input matInput formControlName="vetPhone"></mat-form-field>
            <mat-form-field appearance="outline" class="full-field"><mat-label>Medical history</mat-label><textarea matInput rows="3" formControlName="medicalHistory"></textarea></mat-form-field>
            <label class="upload-drop full-field">
              <mat-icon>add_photo_alternate</mat-icon>
              <span>Upload pet photo</span>
              <input type="file" accept="image/*" (change)="onPetPhotoSelected($event)">
            </label>
          </div>
          <button mat-flat-button color="primary" type="submit" [disabled]="petForm.invalid">Save Profile</button>
        </form>

        <div class="panel-list">
          <h2>Your pets</h2>
          @for (pet of pets(); track pet.id) {
            <article class="pet-row">
              <div>
                <strong>{{ pet.name }}</strong>
                <span>{{ pet.breed }} - {{ pet.age }} yrs - {{ pet.weight }} lbs</span>
              </div>
              <div class="row-actions">
                <button mat-icon-button matTooltip="Edit" (click)="editPet(pet)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button matTooltip="Delete" (click)="deletePet(pet.id)"><mat-icon>delete</mat-icon></button>
              </div>
            </article>
          }
        </div>
      </div>

      <div class="portal-grid two-column records-zone">
        <form class="panel-form" [formGroup]="vaccineForm" (ngSubmit)="addVaccine()">
          <h2>Vaccine record</h2>
          <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select formControlName="petProfileId">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Vaccine</mat-label><input matInput formControlName="vaccineName"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Given date</mat-label><input matInput type="date" formControlName="givenDate"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Due date</mat-label><input matInput type="date" formControlName="dueDate"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Provider</mat-label><input matInput formControlName="providerName"></mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="vaccineForm.invalid">Add Vaccine</button>
        </form>

        <form class="panel-form" [formGroup]="medicalForm" (ngSubmit)="addMedicalRecord()">
          <h2>Medical record</h2>
          <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select formControlName="petProfileId">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title" placeholder="Reminder"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Record type</mat-label><input matInput formControlName="recordType"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Provider</mat-label><input matInput formControlName="providerName"></mat-form-field>
          <label class="upload-drop">
            <mat-icon>upload_file</mat-icon>
            <span>Upload medical file</span>
            <input type="file" (change)="onMedicalFileSelected($event)">
          </label>
          <button mat-flat-button color="primary" type="submit" [disabled]="medicalForm.invalid">Save Record</button>
        </form>
      </div>
    </section>
  `
})
export class PetsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly pets = signal<PetProfile[]>([]);
  readonly editingPetId = signal<string | null>(null);

  readonly petForm = this.fb.nonNullable.group({
    id: [''],
    userId: [''],
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
    vetPhone: ['']
  });

  readonly vaccineForm = this.fb.nonNullable.group({
    petProfileId: ['', Validators.required],
    vaccineName: ['', Validators.required],
    givenDate: [todayForInput(), Validators.required],
    dueDate: [''],
    providerName: [''],
    lotNumber: [''],
    notes: ['']
  });

  readonly medicalForm = this.fb.nonNullable.group({
    petProfileId: ['', Validators.required],
    title: ['', Validators.required],
    recordType: ['General'],
    recordDate: [todayForInput()],
    providerName: [''],
    fileUrl: [''],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadPets();
  }

  loadPets(): void {
    this.api.list<PetProfile>('pets').subscribe({
      next: (result) => {
        this.pets.set(result.items);
        const firstPet = result.items[0];
        if (firstPet && !this.vaccineForm.controls.petProfileId.value) {
          this.vaccineForm.patchValue({ petProfileId: firstPet.id });
          this.medicalForm.patchValue({ petProfileId: firstPet.id });
        }
      }
    });
  }

  savePet(): void {
    if (this.petForm.invalid) {
      this.petForm.markAllAsTouched();
      return;
    }

    const { id: _formId, userId, ...petPayload } = this.petForm.getRawValue();
    const request: Observable<unknown> = this.editingPetId()
      ? this.api.update<PetProfile>('pets', { ...(petPayload as PetProfile), id: this.editingPetId()!, userId })
      : this.api.create<PetProfile>('pets', petPayload);

    request.subscribe({
      next: () => {
        this.snackBar.open('Pet profile saved.', 'Close', { duration: 2500 });
        this.resetPetForm();
        this.loadPets();
      }
    });
  }

  editPet(pet: PetProfile): void {
    this.editingPetId.set(pet.id);
    this.petForm.patchValue({
      ...pet,
      photoUrl: pet.photoUrl ?? ''
    });
  }

  deletePet(id: string): void {
    this.api.delete('pets', id).subscribe(() => {
      this.snackBar.open('Pet profile deleted.', 'Close', { duration: 2500 });
      this.loadPets();
    });
  }

  resetPetForm(): void {
    this.editingPetId.set(null);
    this.petForm.reset({ id: '', userId: '', name: '', species: 'Dog', breed: '', age: 1, weight: 1, gender: 'Unknown', photoUrl: '', allergies: '', medicalHistory: '', vetName: '', vetPhone: '' });
  }

  onPetPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    this.api.uploadMedia(file, 'pet-photo', file.name).subscribe((media) => {
      this.petForm.patchValue({ photoUrl: media.url });
      this.snackBar.open('Pet photo uploaded.', 'Close', { duration: 2500 });
    });
  }

  onMedicalFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    this.api.uploadMedia(file, 'medical-record', file.name).subscribe((media) => {
      this.medicalForm.patchValue({ fileUrl: media.url });
      this.snackBar.open('Medical file uploaded.', 'Close', { duration: 2500 });
    });
  }

  addVaccine(): void {
    if (this.vaccineForm.invalid) {
      return;
    }

    this.api.create<VaccineRecord>('vaccine-records', this.vaccineForm.getRawValue()).subscribe(() => {
      this.snackBar.open('Vaccine record saved.', 'Close', { duration: 2500 });
      this.vaccineForm.patchValue({ vaccineName: '', dueDate: '', providerName: '', lotNumber: '', notes: '' });
    });
  }

  addMedicalRecord(): void {
    if (this.medicalForm.invalid) {
      return;
    }

    this.api.create<MedicalRecord>('medical-records', this.medicalForm.getRawValue()).subscribe(() => {
      this.snackBar.open('Medical record saved.', 'Close', { duration: 2500 });
      this.medicalForm.patchValue({ title: '', recordType: 'General', providerName: '', fileUrl: '', notes: '' });
    });
  }
}

@Component({
  selector: 'app-behavior',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading"><div><p class="eyebrow">Behavior Monitoring</p><h1>Daily behavior logs</h1></div></div>
      <div class="portal-grid two-column">
        <form class="panel-form" [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select formControlName="petProfileId">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Eating</mat-label><input matInput formControlName="eating"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Sleeping</mat-label><input matInput formControlName="sleeping"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Mood</mat-label><input matInput formControlName="mood"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Activity</mat-label><input matInput formControlName="activity"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Bathroom habits</mat-label><input matInput formControlName="bathroomHabits"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Symptoms</mat-label><input matInput formControlName="symptoms"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Unusual behavior</mat-label><input matInput formControlName="unusualBehavior"></mat-form-field>
          <mat-form-field appearance="outline" class="full-field"><mat-label>Notes</mat-label><textarea matInput rows="3" formControlName="notes"></textarea></mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save Behavior Log</button>
        </form>
        <div class="panel-list">
          <h2>Recent behavior</h2>
          @for (log of logs(); track log.id) {
            <article class="log-row">
              <strong>{{ log.mood }} - {{ log.activity }}</strong>
              <span>{{ log.eating }} eating, {{ log.sleeping }} sleeping</span>
              <p>{{ log.notes || log.unusualBehavior || 'No notes' }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class BehaviorComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly pets = signal<PetProfile[]>([]);
  readonly logs = signal<BehaviorLog[]>([]);
  readonly form = this.fb.nonNullable.group({
    petProfileId: ['', Validators.required],
    logDate: [new Date().toISOString()],
    eating: ['Normal'],
    sleeping: ['Normal'],
    mood: ['Calm'],
    activity: ['Moderate'],
    bathroomHabits: ['Normal'],
    symptoms: [''],
    unusualBehavior: [''],
    notes: ['']
  });

  ngOnInit(): void {
    this.api.list<PetProfile>('pets').subscribe((result) => {
      this.pets.set(result.items);
      if (result.items[0]) {
        this.form.patchValue({ petProfileId: result.items[0].id });
      }
    });
    this.load();
  }

  load(): void {
    this.api.list<BehaviorLog>('behavior-logs').subscribe((result) => this.logs.set(result.items));
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.api.create<BehaviorLog>('behavior-logs', this.form.getRawValue()).subscribe(() => {
      this.snackBar.open('Behavior log saved.', 'Close', { duration: 2500 });
      this.form.patchValue({ logDate: new Date().toISOString(), symptoms: '', unusualBehavior: '', notes: '' });
      this.load();
    });
  }
}

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading"><div><p class="eyebrow">Health & Wellness Tracker</p><h1>Wellness score and symptom history</h1></div></div>
      <div class="portal-grid two-column">
        <form class="panel-form" [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select formControlName="petProfileId">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Wellness score</mat-label><input matInput type="number" min="0" max="100" formControlName="wellnessScore"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Weight</mat-label><input matInput type="number" formControlName="weight"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Appetite</mat-label><input matInput formControlName="appetite"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Hydration</mat-label><input matInput formControlName="hydration"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Energy level</mat-label><input matInput formControlName="energyLevel"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Symptoms</mat-label><input matInput formControlName="symptoms"></mat-form-field>
          <mat-form-field appearance="outline" class="full-field"><mat-label>Notes</mat-label><textarea matInput rows="3" formControlName="notes"></textarea></mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save Health Log</button>
        </form>
        <div class="analytics-panel">
          <h2>Wellness trend</h2>
          <svg viewBox="0 0 320 150" class="wellness-chart" role="img" aria-label="Wellness score chart">
            <polyline [attr.points]="chartPoints()" />
            @for (log of chartLogs(); track log.id) {
              <circle [attr.cx]="pointX(log)" [attr.cy]="pointY(log)" r="4" />
            }
          </svg>
          <div class="score-summary">
            <span>Average</span>
            <strong>{{ averageScore() }}</strong>
          </div>
          @for (log of logs(); track log.id) {
            <article class="log-row">
              <strong>Score {{ log.wellnessScore }}</strong>
              <span>{{ log.appetite }} appetite - {{ log.energyLevel }} energy</span>
              <p>{{ log.symptoms || log.notes || 'No symptoms noted' }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class HealthComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly pets = signal<PetProfile[]>([]);
  readonly logs = signal<HealthLog[]>([]);
  readonly chartLogs = computed(() => [...this.logs()].reverse().slice(-8));
  readonly averageScore = computed(() => {
    const logs = this.logs();
    return logs.length ? Math.round(logs.reduce((sum, log) => sum + log.wellnessScore, 0) / logs.length) : 0;
  });

  readonly form = this.fb.nonNullable.group({
    petProfileId: ['', Validators.required],
    logDate: [new Date().toISOString()],
    weight: [0],
    wellnessScore: [80, [Validators.required, Validators.min(0), Validators.max(100)]],
    symptoms: [''],
    appetite: ['Normal'],
    hydration: ['Good'],
    energyLevel: ['Normal'],
    notes: ['']
  });

  ngOnInit(): void {
    this.api.list<PetProfile>('pets').subscribe((result) => {
      this.pets.set(result.items);
      if (result.items[0]) {
        this.form.patchValue({ petProfileId: result.items[0].id, weight: result.items[0].weight });
      }
    });
    this.load();
  }

  load(): void {
    this.api.list<HealthLog>('health-logs').subscribe((result) => this.logs.set(result.items));
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.api.create<HealthLog>('health-logs', this.form.getRawValue()).subscribe(() => {
      this.snackBar.open('Health log saved.', 'Close', { duration: 2500 });
      this.form.patchValue({ logDate: new Date().toISOString(), symptoms: '', notes: '' });
      this.load();
    });
  }

  chartPoints(): string {
    return this.chartLogs().map((log) => `${this.pointX(log)},${this.pointY(log)}`).join(' ');
  }

  pointX(log: HealthLog): number {
    const logs = this.chartLogs();
    const index = logs.findIndex((item) => item.id === log.id);
    return logs.length <= 1 ? 24 : 24 + (index * 272) / (logs.length - 1);
  }

  pointY(log: HealthLog): number {
    return 126 - Math.max(0, Math.min(100, log.wellnessScore)) * 1.02;
  }
}

@Component({
  selector: 'app-medications',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading"><div><p class="eyebrow">Medication Management</p><h1>Medication reminders</h1></div></div>
      <div class="portal-grid two-column">
        <form class="panel-form" [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select formControlName="petProfileId">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Medicine name</mat-label><input matInput formControlName="medicineName"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Dosage</mat-label><input matInput formControlName="dosage"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Frequency</mat-label><input matInput formControlName="frequency"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Start date</mat-label><input matInput type="date" formControlName="startDate"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>End date</mat-label><input matInput type="date" formControlName="endDate"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Alert time</mat-label><input matInput type="time" formControlName="alertTime"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select formControlName="status"><mat-option value="Active">Active</mat-option><mat-option value="Paused">Paused</mat-option><mat-option value="Complete">Complete</mat-option></mat-select></mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save Reminder</button>
        </form>
        <div class="panel-list">
          <h2>Active schedule</h2>
          @for (item of reminders(); track item.id) {
            <article class="log-row">
              <strong>{{ item.medicineName }} - {{ item.dosage }}</strong>
              <span>{{ item.frequency }} at {{ item.alertTime }} - {{ item.status }}</span>
              <p>{{ item.notes }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class MedicationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly pets = signal<PetProfile[]>([]);
  readonly reminders = signal<MedicationReminder[]>([]);
  readonly form = this.fb.nonNullable.group({
    petProfileId: ['', Validators.required],
    medicineName: ['', Validators.required],
    dosage: ['', Validators.required],
    frequency: ['Daily'],
    startDate: [todayForInput()],
    endDate: [''],
    status: ['Active'],
    alertTime: ['09:00:00'],
    notes: ['']
  });

  ngOnInit(): void {
    this.api.list<PetProfile>('pets').subscribe((result) => {
      this.pets.set(result.items);
      if (result.items[0]) {
        this.form.patchValue({ petProfileId: result.items[0].id });
      }
    });
    this.load();
  }

  load(): void {
    this.api.list<MedicationReminder>('medication-reminders').subscribe((result) => this.reminders.set(result.items));
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.api.create<MedicationReminder>('medication-reminders', { ...value, alertTime: value.alertTime.length === 5 ? `${value.alertTime}:00` : value.alertTime }).subscribe(() => {
      this.snackBar.open('Medication reminder saved.', 'Close', { duration: 2500 });
      this.form.patchValue({ medicineName: '', dosage: '', notes: '' });
      this.load();
    });
  }
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading"><div><p class="eyebrow">Appointment Calendar</p><h1>Vet, grooming, vaccines, and care visits</h1></div></div>
      <div class="portal-grid two-column">
        <form class="panel-form" [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select formControlName="petProfileId">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Type</mat-label><mat-select formControlName="type"><mat-option value="Vet Visit">Vet Visit</mat-option><mat-option value="Grooming">Grooming</mat-option><mat-option value="Vaccine">Vaccine</mat-option><mat-option value="Follow-up">Follow-up</mat-option><mat-option value="General Care">General Care</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Provider</mat-label><input matInput formControlName="providerName"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Location</mat-label><input matInput formControlName="location"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Scheduled at</mat-label><input matInput type="datetime-local" formControlName="scheduledAt"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select formControlName="status"><mat-option value="Scheduled">Scheduled</mat-option><mat-option value="Completed">Completed</mat-option><mat-option value="Cancelled">Cancelled</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline" class="full-field"><mat-label>Reminder notes</mat-label><textarea matInput rows="3" formControlName="notes"></textarea></mat-form-field>
          <div class="button-row">
            <button mat-flat-button color="primary" type="submit" [disabled]="!canSaveAppointment()">{{ editingAppointmentId() ? 'Update Appointment' : 'Save Appointment' }}</button>
            <button mat-stroked-button type="button" (click)="newAppointment()"><mat-icon>add</mat-icon>New Reminder</button>
          </div>
        </form>
        <div class="calendar-panel">
          <div class="calendar-heading">
            <h2>Upcoming care</h2>
            <span>{{ selectedCalendarDateLabel() }}</span>
          </div>
          <div class="calendar-grid">
            @for (day of calendarDays(); track day.date) {
              <button type="button" class="calendar-day" [class.has-event]="day.events.length" [class.selected]="day.date === selectedCalendarDate()" (click)="selectCalendarDay(day.date)">
                <strong>{{ day.label }}</strong>
                @for (event of day.events; track event.id) {
                  <span class="calendar-event" (click)="editAppointment(event, $event)">
                    {{ event.title }}
                    @if (event.notes) {
                      <small>{{ event.notes }}</small>
                    }
                  </span>
                }
              </button>
            }
          </div>
          <div class="calendar-reminder-editor" [formGroup]="form">
            <h3>{{ editingAppointmentId() ? 'Edit reminder' : 'Add reminder for selected date' }}</h3>
            <div class="grid-form">
              <mat-form-field appearance="outline">
                <mat-label>Reminder title</mat-label>
                <input matInput formControlName="title" placeholder="Reminder">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Date and time</mat-label>
                <input matInput type="datetime-local" formControlName="scheduledAt">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-field">
                <mat-label>Notes for reminder</mat-label>
                <textarea matInput rows="4" formControlName="notes"></textarea>
              </mat-form-field>
            </div>
            <div class="button-row">
              <button mat-flat-button color="primary" type="button" (click)="save()" [disabled]="!canSaveAppointment()">
                <mat-icon>event_available</mat-icon>{{ editingAppointmentId() ? 'Update Reminder' : 'Save Reminder' }}
              </button>
              <button mat-stroked-button type="button" (click)="newAppointment()">Clear</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class AppointmentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly pets = signal<PetProfile[]>([]);
  readonly appointments = signal<Appointment[]>([]);
  readonly editingAppointmentId = signal<string | null>(null);
  readonly selectedCalendarDate = signal(todayForInput());
  readonly form = this.fb.nonNullable.group({
    petProfileId: ['', Validators.required],
    type: ['Vet Visit'],
    title: [''],
    providerName: [''],
    location: [''],
    scheduledAt: [nowForInput(), Validators.required],
    status: ['Scheduled'],
    notes: ['']
  });

  ngOnInit(): void {
    this.api.list<PetProfile>('pets').subscribe((result) => {
      this.pets.set(result.items);
      if (result.items[0]) {
        this.form.patchValue({ petProfileId: result.items[0].id });
        this.newAppointment();
      }
    });
    this.load();
  }

  load(): void {
    this.api.list<Appointment>('appointments').subscribe((result) => this.appointments.set(result.items));
  }

  save(): void {
    if (!this.canSaveAppointment()) {
      this.form.markAllAsTouched();
      this.snackBar.open('Choose a pet and date/time before saving the reminder.', 'Close', { duration: 3500 });
      return;
    }

    const value = this.normalizedAppointmentPayload();
    const request: Observable<unknown> = this.editingAppointmentId()
      ? this.api.update<Appointment>('appointments', { ...(value as Appointment), id: this.editingAppointmentId()! })
      : this.api.create<Appointment>('appointments', value);

    request.subscribe(() => {
      this.snackBar.open(this.editingAppointmentId() ? 'Reminder updated.' : 'Reminder saved.', 'Close', { duration: 2500 });
      this.newAppointment();
      this.load();
    }, () => {
      this.snackBar.open('Appointment could not be saved. Please check the date, pet, and notes.', 'Close', { duration: 4500 });
    });
  }

  canSaveAppointment(): boolean {
    return Boolean(this.form.controls.petProfileId.value && this.form.controls.scheduledAt.value);
  }

  normalizedAppointmentPayload(): Partial<Appointment> {
    const value = this.form.getRawValue();
    const selectedDate = value.scheduledAt || `${this.selectedCalendarDate()}T09:00`;
    return {
      ...value,
      title: value.title.trim() || 'Reminder',
      type: value.type || 'General Care',
      providerName: value.providerName ?? '',
      location: value.location ?? '',
      status: value.status || 'Scheduled',
      notes: value.notes ?? '',
      scheduledAt: selectedDate.length === 16 ? `${selectedDate}:00` : selectedDate
    };
  }

  selectCalendarDay(date: string): void {
    this.selectedCalendarDate.set(date);
    const currentTime = this.form.controls.scheduledAt.value.slice(11, 16) || '09:00';
    this.form.patchValue({ scheduledAt: `${date}T${currentTime}` });
  }

  editAppointment(appointment: Appointment, event?: Event): void {
    event?.stopPropagation();
    this.editingAppointmentId.set(appointment.id);
    this.selectedCalendarDate.set(appointment.scheduledAt.slice(0, 10));
    this.form.patchValue({
      petProfileId: appointment.petProfileId,
      type: appointment.type,
      title: appointment.title,
      providerName: appointment.providerName,
      location: appointment.location,
      scheduledAt: appointment.scheduledAt.slice(0, 16),
      status: appointment.status,
      notes: appointment.notes
    });
  }

  newAppointment(): void {
    this.editingAppointmentId.set(null);
    const firstPet = this.pets()[0];
    const selectedDate = this.selectedCalendarDate();
    this.form.reset({
      petProfileId: firstPet?.id ?? '',
      type: 'Vet Visit',
      title: '',
      providerName: '',
      location: '',
      scheduledAt: `${selectedDate}T09:00`,
      status: 'Scheduled',
      notes: ''
    });
  }

  selectedCalendarDateLabel(): string {
    const date = new Date(`${this.selectedCalendarDate()}T00:00:00`);
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  calendarDays(): Array<{ date: string; label: string; events: Appointment[] }> {
    const today = new Date();
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      return {
        date: key,
        label: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        events: this.appointments().filter((item) => item.scheduledAt.slice(0, 10) === key)
      };
    });
  }
}

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading">
        <div><p class="eyebrow">AI Insights & Recommendations</p><h1>Behavior and symptom analysis</h1></div>
        <button mat-flat-button color="primary" (click)="generate()" [disabled]="!selectedPetId()"><mat-icon>auto_awesome</mat-icon>Generate Insight</button>
      </div>
      <mat-form-field appearance="outline" class="pet-select">
        <mat-label>Pet</mat-label>
        <mat-select [value]="selectedPetId()" (selectionChange)="selectedPetId.set($event.value)">
          @for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }
        </mat-select>
      </mat-form-field>
      <div class="insight-grid">
        @for (insight of insights(); track insight.id || insight.title) {
          <article class="insight-card" [class.high]="insight.riskLevel === 'High'" [class.medium]="insight.riskLevel === 'Medium'">
            <span>{{ insight.riskLevel }} Risk</span>
            <h2>{{ insight.title }}</h2>
            <p>{{ insight.recommendation }}</p>
            <strong>{{ insight.nextAction }}</strong>
            <small>{{ insight.sourceSummary }}</small>
          </article>
        }
      </div>
    </section>
  `
})
export class InsightsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  readonly pets = signal<PetProfile[]>([]);
  readonly insights = signal<AiInsight[]>([]);
  readonly selectedPetId = signal<string>('');

  ngOnInit(): void {
    this.api.list<PetProfile>('pets').subscribe((result) => {
      this.pets.set(result.items);
      this.selectedPetId.set(result.items[0]?.id ?? '');
    });
    this.load();
  }

  load(): void {
    this.api.list<AiInsight>('ai-insights').subscribe((result) => this.insights.set(result.items));
  }

  generate(): void {
    const petId = this.selectedPetId();
    if (!petId) {
      return;
    }

    this.api.generateInsight(petId).subscribe((insight) => {
      this.insights.set([insight, ...this.insights()]);
      this.snackBar.open('AI insight generated from current logs.', 'Close', { duration: 3000 });
    });
  }
}

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading"><div><p class="eyebrow">Training Guidance</p><h1>Guides by age, breed, and concern</h1></div></div>
      <mat-form-field appearance="outline" class="pet-select"><mat-label>Search guides</mat-label><input matInput [value]="search()" (input)="search.set($any($event.target).value); load()"></mat-form-field>
      <div class="guide-grid">
        @for (guide of guides(); track guide.id) {
          <article class="guide-card">
            <span>{{ guide.difficulty }}</span>
            <h2>{{ guide.title }}</h2>
            <p>{{ guide.species }} - {{ guide.ageRange }} - {{ guide.concern }}</p>
            <p>{{ guide.steps }}</p>
          </article>
        }
      </div>
    </section>
  `
})
export class TrainingComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly guides = signal<TrainingGuide[]>([]);
  readonly search = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.list<TrainingGuide>('training-guides', this.search()).subscribe((result) => this.guides.set(result.items));
  }
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading"><div><p class="eyebrow">Progress Reports</p><h1>Care progress over time</h1></div></div>
      <div class="portal-grid two-column">
        <form class="panel-form" [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select formControlName="petProfileId">@for (pet of pets(); track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Period start</mat-label><input matInput type="date" formControlName="periodStart"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Period end</mat-label><input matInput type="date" formControlName="periodEnd"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Average wellness score</mat-label><input matInput type="number" formControlName="averageWellnessScore"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Behavior trend</mat-label><input matInput formControlName="behaviorTrend"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Health trend</mat-label><input matInput formControlName="healthTrend"></mat-form-field>
          <mat-form-field appearance="outline" class="full-field"><mat-label>Summary</mat-label><textarea matInput rows="3" formControlName="summary"></textarea></mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save Report</button>
        </form>
        <div class="analytics-panel">
          <h2>Report history</h2>
          <svg viewBox="0 0 320 150" class="wellness-chart" role="img" aria-label="Progress report chart">
            <polyline [attr.points]="reportPoints()" />
          </svg>
          @for (report of reports(); track report.id) {
            <article class="log-row">
              <strong>{{ report.averageWellnessScore }} average wellness</strong>
              <span>{{ report.behaviorTrend }} behavior - {{ report.healthTrend }} health</span>
              <p>{{ report.summary }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class ReportsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly pets = signal<PetProfile[]>([]);
  readonly reports = signal<ProgressReport[]>([]);
  readonly form = this.fb.nonNullable.group({
    petProfileId: ['', Validators.required],
    periodStart: [todayForInput()],
    periodEnd: [todayForInput()],
    averageWellnessScore: [80],
    behaviorTrend: ['Stable'],
    healthTrend: ['Stable'],
    summary: ['']
  });

  ngOnInit(): void {
    this.api.list<PetProfile>('pets').subscribe((result) => {
      this.pets.set(result.items);
      if (result.items[0]) {
        this.form.patchValue({ petProfileId: result.items[0].id });
      }
    });
    this.load();
  }

  load(): void {
    this.api.list<ProgressReport>('progress-reports').subscribe((result) => this.reports.set(result.items));
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.api.create<ProgressReport>('progress-reports', this.form.getRawValue()).subscribe(() => {
      this.snackBar.open('Progress report saved.', 'Close', { duration: 2500 });
      this.form.patchValue({ summary: '' });
      this.load();
    });
  }

  reportPoints(): string {
    const reports = [...this.reports()].reverse().slice(-8);
    if (!reports.length) {
      return '';
    }

    return reports.map((report, index) => {
      const x = reports.length <= 1 ? 24 : 24 + (index * 272) / (reports.length - 1);
      const y = 126 - Math.max(0, Math.min(100, report.averageWellnessScore)) * 1.02;
      return `${x},${y}`;
    }).join(' ');
  }
}
