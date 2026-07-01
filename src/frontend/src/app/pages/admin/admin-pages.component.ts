import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import {
  ContactSubmission,
  HeroSection,
  MediaFile,
  Recommendation,
  TrainingGuide
} from '../../core/models';
import { SHARED_IMPORTS } from '../../shared/ui';

type FieldType = 'text' | 'textarea' | 'number' | 'checkbox';
type ContentRecord = Record<string, string | number | boolean | null | undefined> & { id?: string };

interface ContentField {
  key: string;
  label: string;
  type: FieldType;
}

interface ContentConfig {
  label: string;
  path: string;
  titleKey: string;
  defaults: ContentRecord;
  fields: ContentField[];
}

const contentConfigs: ContentConfig[] = [
  {
    label: 'Hero Section',
    path: 'admin/hero-sections',
    titleKey: 'title',
    defaults: { title: 'PetSense AI', headline: 'Complete Care for Every Pet', subtitle: 'Track your pet\'s health, create personalized nutrition plans, monitor daily progress, and understand your pet like never before.', primaryCtaText: 'Start Tracking', secondaryCtaText: 'Create Nutrition Plan', imageUrl: 'assets/petsense-complete-care.png', isActive: true },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { key: 'primaryCtaText', label: 'Primary CTA', type: 'text' },
      { key: 'secondaryCtaText', label: 'Secondary CTA', type: 'text' },
      { key: 'imageUrl', label: 'Image URL', type: 'text' },
      { key: 'isActive', label: 'Active', type: 'checkbox' }
    ]
  },
  {
    label: 'Complete Care Section',
    path: 'admin/website-sections',
    titleKey: 'title',
    defaults: { key: 'complete-care', title: 'Complete Care for Every Pet', subtitle: 'Health, nutrition, daily progress, and wellness in one place.', body: 'PetSense AI helps owners provide complete care for every pet with connected profiles, health tracking, nutrition planning, appointments, medication, and AI wellness insights.', sortOrder: 3, isPublished: true },
    fields: [
      { key: 'key', label: 'Key', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'Health Tracking Section',
    path: 'admin/website-sections',
    titleKey: 'title',
    defaults: { key: 'health-tracking', title: 'Easy Health Tracking', subtitle: 'Log important health changes before they become hard to understand.', body: 'Track symptoms, weight, mood, sleep, activity, food, hydration, and wellness changes from one simple care workspace.', sortOrder: 4, isPublished: true },
    fields: [
      { key: 'key', label: 'Key', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'Nutrition Plan Section',
    path: 'admin/website-sections',
    titleKey: 'title',
    defaults: { key: 'nutrition-plan', title: 'AI-Powered Nutrition Planning', subtitle: 'Personalized feeding guidance for healthier routines.', body: 'Create nutrition plans using pet type, breed, age, weight, allergies, activity level, current food, and health goals.', sortOrder: 5, isPublished: true },
    fields: [
      { key: 'key', label: 'Key', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'Daily Progress Section',
    path: 'admin/website-sections',
    titleKey: 'title',
    defaults: { key: 'daily-progress', title: 'Daily Progress Tracking', subtitle: 'See how care decisions affect wellness over time.', body: 'Monitor daily, weekly, and monthly progress charts for health, behavior, nutrition, training, medication, and wellness score.', sortOrder: 6, isPublished: true },
    fields: [
      { key: 'key', label: 'Key', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'AI Wellness Insights Section',
    path: 'admin/website-sections',
    titleKey: 'title',
    defaults: { key: 'ai-wellness-insights', title: 'AI Wellness Insights', subtitle: 'Better care, stronger bond, healthier pets.', body: 'PetSense AI turns health logs, behavior patterns, nutrition records, and progress reports into clear recommendations and next actions.', sortOrder: 7, isPublished: true },
    fields: [
      { key: 'key', label: 'Key', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'Problems',
    path: 'admin/problems',
    titleKey: 'title',
    defaults: { title: '', description: '', sortOrder: 1, isPublished: true },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'Solutions',
    path: 'admin/solutions',
    titleKey: 'title',
    defaults: { title: '', description: '', sortOrder: 1, isPublished: true },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'Features',
    path: 'admin/features',
    titleKey: 'title',
    defaults: { title: '', description: '', icon: 'pets', sortOrder: 1, isPublished: true },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'icon', label: 'Material icon', type: 'text' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'How It Works',
    path: 'admin/how-it-works',
    titleKey: 'title',
    defaults: { title: '', description: '', stepNumber: 1, isPublished: true },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'stepNumber', label: 'Step number', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'Why Now / Website Sections',
    path: 'admin/website-sections',
    titleKey: 'title',
    defaults: { key: 'why-now', title: 'Why Now', subtitle: '', body: '', sortOrder: 1, isPublished: true },
    fields: [
      { key: 'key', label: 'Key', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'Target Customers',
    path: 'admin/target-customers',
    titleKey: 'name',
    defaults: { name: '', description: '', sortOrder: 1, isPublished: true },
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'Comparison Table',
    path: 'admin/comparison-items',
    titleKey: 'capability',
    defaults: { capability: '', petSenseValue: '', traditionalValue: '', sortOrder: 1, isPublished: true },
    fields: [
      { key: 'capability', label: 'Capability', type: 'text' },
      { key: 'petSenseValue', label: 'PetSense AI value', type: 'textarea' },
      { key: 'traditionalValue', label: 'Traditional value', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  },
  {
    label: 'Testimonials',
    path: 'admin/testimonials',
    titleKey: 'customerName',
    defaults: { customerName: '', customerRole: '', quote: '', rating: 5, isPublished: true },
    fields: [
      { key: 'customerName', label: 'Customer name', type: 'text' },
      { key: 'customerRole', label: 'Customer role', type: 'text' },
      { key: 'quote', label: 'Quote', type: 'textarea' },
      { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ]
  }
];

@Component({
  selector: 'app-admin-content',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading">
        <div><p class="eyebrow">Admin</p><h1>Dynamic website content</h1></div>
        <mat-form-field appearance="outline" class="compact-select">
          <mat-label>Content type</mat-label>
          <mat-select [value]="selectedIndex()" (selectionChange)="selectConfig($event.value)">
            @for (option of configs; track option.path; let index = $index) {
              <mat-option [value]="index">{{ option.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <div class="portal-grid two-column">
        <form class="panel-form" [formGroup]="form" (ngSubmit)="save()">
          <h2>{{ editingId() ? 'Edit' : 'Create' }} {{ config().label }}</h2>
          @for (field of config().fields; track field.key) {
            @if (field.type === 'checkbox') {
              <mat-checkbox [formControlName]="field.key">{{ field.label }}</mat-checkbox>
            } @else {
              <mat-form-field appearance="outline">
                <mat-label>{{ field.label }}</mat-label>
                @if (field.type === 'textarea') {
                  <textarea matInput rows="3" [formControlName]="field.key"></textarea>
                } @else {
                  <input matInput [type]="field.type === 'number' ? 'number' : 'text'" [formControlName]="field.key">
                }
              </mat-form-field>
            }
          }
          <div class="button-row">
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
            <button mat-stroked-button type="button" (click)="reset()">New</button>
          </div>
        </form>

        <div class="panel-list">
          <h2>{{ config().label }}</h2>
          @for (item of items(); track item['id']) {
            <article class="admin-row">
              <div>
                <strong>{{ display(item, config().titleKey) }}</strong>
                <span>{{ display(item, 'description') || display(item, 'subtitle') || display(item, 'body') }}</span>
              </div>
              <div class="row-actions">
                <button mat-icon-button matTooltip="Edit" (click)="edit(item)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button matTooltip="Delete" (click)="delete(item)"><mat-icon>delete</mat-icon></button>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class AdminContentComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(UntypedFormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly configs = contentConfigs;
  readonly selectedIndex = signal(0);
  readonly items = signal<ContentRecord[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly config = computed(() => this.configs[this.selectedIndex()]);
  form = this.fb.group({});

  ngOnInit(): void {
    this.rebuildForm();
    this.load();
  }

  selectConfig(index: number): void {
    this.selectedIndex.set(index);
    this.reset();
    this.load();
  }

  load(): void {
    this.api.list<ContentRecord>(this.config().path).subscribe((result) => this.items.set(result.items));
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const body = { ...this.config().defaults, ...this.form.getRawValue() } as ContentRecord;
    const request: Observable<unknown> = this.editingId()
      ? this.api.update<ContentRecord & { id: string }>(this.config().path, { ...body, id: this.editingId()! })
      : this.api.create<ContentRecord>(this.config().path, body);

    request.subscribe(() => {
      this.snackBar.open('Content saved. Public website will reflect the update.', 'Close', { duration: 3000 });
      this.reset();
      this.load();
    });
  }

  edit(item: ContentRecord): void {
    this.editingId.set(item.id ?? null);
    this.form.patchValue(item);
  }

  delete(item: ContentRecord): void {
    if (!item.id) {
      return;
    }

    this.api.delete(this.config().path, item.id).subscribe(() => {
      this.snackBar.open('Content deleted.', 'Close', { duration: 2500 });
      this.load();
    });
  }

  reset(): void {
    this.editingId.set(null);
    this.rebuildForm();
  }

  display(item: ContentRecord, key: string): string {
    const value = item[key];
    return value === undefined || value === null ? '' : String(value);
  }

  private rebuildForm(): void {
    const controls = this.config().fields.reduce<Record<string, unknown>>((acc, field) => {
      acc[field.key] = [this.config().defaults[field.key] ?? '', field.key === this.config().titleKey ? Validators.required : []];
      return acc;
    }, {});
    this.form = this.fb.group(controls);
  }
}

@Component({
  selector: 'app-admin-contacts',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading"><div><p class="eyebrow">Admin</p><h1>Contact and waitlist submissions</h1></div></div>
      <div class="panel-list wide-list">
        @for (contact of contacts(); track contact.id) {
          <article class="admin-row">
            <div>
              <strong>{{ contact.name }} - {{ contact.email }}</strong>
              <span>{{ contact.petType }} - {{ contact.message || 'No message' }}</span>
            </div>
            <mat-form-field appearance="outline" class="status-field">
              <mat-label>Status</mat-label>
              <mat-select [value]="contact.status" (selectionChange)="setStatus(contact, $event.value)">
                <mat-option value="New">New</mat-option>
                <mat-option value="Contacted">Contacted</mat-option>
                <mat-option value="Closed">Closed</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-icon-button matTooltip="Delete submission" (click)="deleteContact(contact)"><mat-icon>delete</mat-icon></button>
          </article>
        }
      </div>
    </section>
  `
})
export class AdminContactsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  readonly contacts = signal<ContactSubmission[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.list<ContactSubmission>('admin/contact-submissions').subscribe((result) => this.contacts.set(result.items));
  }

  setStatus(contact: ContactSubmission, status: string): void {
    this.api.update<ContactSubmission>('admin/contact-submissions', { ...contact, status }).subscribe(() => {
      this.snackBar.open('Submission status updated.', 'Close', { duration: 2500 });
      this.load();
    });
  }

  deleteContact(contact: ContactSubmission): void {
    this.api.delete('admin/contact-submissions', contact.id).subscribe(() => {
      this.snackBar.open('Submission deleted.', 'Close', { duration: 2500 });
      this.load();
    });
  }
}

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading"><div><p class="eyebrow">Admin</p><h1>User management</h1></div></div>
      <div class="panel-list wide-list">
        @for (user of users(); track user.id) {
          <article class="admin-row">
            <div>
              <strong>{{ user.firstName }} {{ user.lastName }}</strong>
              <span>{{ user.email }} - {{ user.roles.join(', ') }}</span>
            </div>
            <mat-checkbox [checked]="user.isActive" (change)="setActive(user, $event.checked)">Active</mat-checkbox>
          </article>
        }
      </div>
    </section>
  `
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  readonly users = signal<AdminUser[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.rawGet<AdminUser[]>('admin/users').subscribe((users) => this.users.set(users));
  }

  setActive(user: AdminUser, isActive: boolean): void {
    this.api.patch<void>(`admin/users/${user.id}/status`, isActive).subscribe(() => {
      this.snackBar.open('User status updated.', 'Close', { duration: 2500 });
      this.load();
    });
  }
}

@Component({
  selector: 'app-admin-training',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading"><div><p class="eyebrow">Admin</p><h1>Training guides and recommendation templates</h1></div></div>
      <div class="portal-grid two-column">
        <form class="panel-form" [formGroup]="guideForm" (ngSubmit)="saveGuide()">
          <h2>{{ editingGuideId() ? 'Edit training guide' : 'Training guide' }}</h2>
          <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Species</mat-label><input matInput formControlName="species"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Breed</mat-label><input matInput formControlName="breed"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Age range</mat-label><input matInput formControlName="ageRange"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Concern</mat-label><input matInput formControlName="concern"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Difficulty</mat-label><input matInput formControlName="difficulty"></mat-form-field>
          <mat-form-field appearance="outline" class="full-field"><mat-label>Steps</mat-label><textarea matInput rows="4" formControlName="steps"></textarea></mat-form-field>
          <mat-checkbox formControlName="isPublished">Published</mat-checkbox>
          <div class="button-row">
            <button mat-flat-button color="primary" type="submit" [disabled]="guideForm.invalid">{{ editingGuideId() ? 'Update Guide' : 'Save Guide' }}</button>
            <button mat-stroked-button type="button" (click)="resetGuide()">New</button>
          </div>
        </form>

        <form class="panel-form" [formGroup]="recommendationForm" (ngSubmit)="saveRecommendation()">
          <h2>{{ editingRecommendationId() ? 'Edit recommendation template' : 'Recommendation template' }}</h2>
          <mat-form-field appearance="outline"><mat-label>Category</mat-label><input matInput formControlName="category"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Trigger rule</mat-label><input matInput formControlName="triggerRule"></mat-form-field>
          <mat-form-field appearance="outline" class="full-field"><mat-label>Body</mat-label><textarea matInput rows="5" formControlName="body"></textarea></mat-form-field>
          <div class="button-row">
            <button mat-flat-button color="primary" type="submit" [disabled]="recommendationForm.invalid">{{ editingRecommendationId() ? 'Update Template' : 'Save Template' }}</button>
            <button mat-stroked-button type="button" (click)="resetRecommendation()">New</button>
          </div>
        </form>
      </div>

      <div class="portal-grid two-column records-zone">
        <div class="panel-list">
          <h2>Guides</h2>
          @for (guide of guides(); track guide.id) {
            <article class="admin-row">
              <div><strong>{{ guide.title }}</strong><span>{{ guide.species }} - {{ guide.concern }}</span></div>
              <div class="row-actions">
                <button mat-icon-button matTooltip="Edit" (click)="editGuide(guide)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button matTooltip="Delete" (click)="deleteGuide(guide)"><mat-icon>delete</mat-icon></button>
              </div>
            </article>
          }
        </div>
        <div class="panel-list">
          <h2>Recommendation templates</h2>
          @for (item of recommendations(); track item.id) {
            <article class="admin-row">
              <div><strong>{{ item.title }}</strong><span>{{ item.category }} - {{ item.triggerRule }}</span></div>
              <div class="row-actions">
                <button mat-icon-button matTooltip="Edit" (click)="editRecommendation(item)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button matTooltip="Delete" (click)="deleteRecommendation(item)"><mat-icon>delete</mat-icon></button>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class AdminTrainingComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(UntypedFormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly guides = signal<TrainingGuide[]>([]);
  readonly recommendations = signal<Recommendation[]>([]);
  readonly editingGuideId = signal<string | null>(null);
  readonly editingRecommendationId = signal<string | null>(null);

  readonly guideForm = this.fb.group({
    title: ['', Validators.required],
    species: ['Dog'],
    breed: [''],
    ageRange: ['Any'],
    concern: [''],
    steps: ['', Validators.required],
    difficulty: ['Beginner'],
    isPublished: [true]
  });

  readonly recommendationForm = this.fb.group({
    category: ['Care'],
    title: ['', Validators.required],
    body: ['', Validators.required],
    triggerRule: [''],
    isTemplate: [true]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.list<TrainingGuide>('training-guides').subscribe((result) => this.guides.set(result.items));
    this.api.list<Recommendation>('recommendations').subscribe((result) => this.recommendations.set(result.items));
  }

  saveGuide(): void {
    if (this.guideForm.invalid) {
      return;
    }

    const body = this.guideForm.getRawValue() as Partial<TrainingGuide>;
    const request: Observable<unknown> = this.editingGuideId()
      ? this.api.update<TrainingGuide>('training-guides', { ...(body as TrainingGuide), id: this.editingGuideId()! })
      : this.api.create<TrainingGuide>('training-guides', body);

    request.subscribe(() => {
      this.snackBar.open(this.editingGuideId() ? 'Training guide updated.' : 'Training guide saved.', 'Close', { duration: 2500 });
      this.resetGuide();
      this.load();
    });
  }

  editGuide(guide: TrainingGuide): void {
    this.editingGuideId.set(guide.id);
    this.guideForm.patchValue(guide);
  }

  deleteGuide(guide: TrainingGuide): void {
    this.api.delete('training-guides', guide.id).subscribe(() => {
      this.snackBar.open('Training guide deleted.', 'Close', { duration: 2500 });
      if (this.editingGuideId() === guide.id) {
        this.resetGuide();
      }
      this.load();
    });
  }

  resetGuide(): void {
    this.editingGuideId.set(null);
    this.guideForm.reset({ title: '', species: 'Dog', breed: '', ageRange: 'Any', concern: '', steps: '', difficulty: 'Beginner', isPublished: true });
  }

  saveRecommendation(): void {
    if (this.recommendationForm.invalid) {
      return;
    }

    const body = this.recommendationForm.getRawValue() as Partial<Recommendation>;
    const request: Observable<unknown> = this.editingRecommendationId()
      ? this.api.update<Recommendation>('recommendations', { ...(body as Recommendation), id: this.editingRecommendationId()! })
      : this.api.create<Recommendation>('recommendations', body);

    request.subscribe(() => {
      this.snackBar.open(this.editingRecommendationId() ? 'Recommendation template updated.' : 'Recommendation template saved.', 'Close', { duration: 2500 });
      this.resetRecommendation();
      this.load();
    });
  }

  editRecommendation(item: Recommendation): void {
    this.editingRecommendationId.set(item.id);
    this.recommendationForm.patchValue(item);
  }

  deleteRecommendation(item: Recommendation): void {
    this.api.delete('recommendations', item.id).subscribe(() => {
      this.snackBar.open('Recommendation template deleted.', 'Close', { duration: 2500 });
      if (this.editingRecommendationId() === item.id) {
        this.resetRecommendation();
      }
      this.load();
    });
  }

  resetRecommendation(): void {
    this.editingRecommendationId.set(null);
    this.recommendationForm.reset({ category: 'Care', title: '', body: '', triggerRule: '', isTemplate: true });
  }
}

@Component({
  selector: 'app-admin-media',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <section class="page-surface">
      <div class="page-heading"><div><p class="eyebrow">Admin</p><h1>Uploaded images and files</h1></div></div>
      <form class="panel-form media-upload" [formGroup]="form" (ngSubmit)="saveMediaDetails()">
        <h2>{{ editingMediaId() ? 'Edit media details' : 'Upload media' }}</h2>
        <mat-form-field appearance="outline"><mat-label>Category</mat-label><input matInput formControlName="category"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Alt text</mat-label><input matInput formControlName="altText"></mat-form-field>
        @if (!editingMediaId()) {
          <label class="upload-drop">
            <mat-icon>cloud_upload</mat-icon>
            <span>Upload image or document</span>
            <input type="file" (change)="upload($event)">
          </label>
        }
        @if (editingMediaId()) {
          <div class="button-row">
            <button mat-flat-button color="primary" type="submit">Update Details</button>
            <button mat-stroked-button type="button" (click)="resetMediaForm()">Cancel</button>
          </div>
        }
      </form>
      <div class="media-grid">
        @for (file of files(); track file.id) {
          <article class="media-card">
            @if (file.contentType.startsWith('image/')) {
              <img [src]="mediaUrl(file.url)" [alt]="file.altText || file.fileName">
            } @else {
              <mat-icon>description</mat-icon>
            }
            <strong>{{ file.fileName }}</strong>
            <span>{{ file.category }}</span>
            @if (file.contentType.startsWith('image/')) {
              <button mat-stroked-button type="button" (click)="setAsHero(file)"><mat-icon>wallpaper</mat-icon>Set as hero</button>
            }
            <button mat-stroked-button type="button" (click)="editMedia(file)"><mat-icon>edit</mat-icon>Edit</button>
            <button mat-stroked-button type="button" color="warn" (click)="deleteMedia(file)"><mat-icon>delete</mat-icon>Delete</button>
          </article>
        }
      </div>
    </section>
  `
})
export class AdminMediaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(UntypedFormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly files = signal<MediaFile[]>([]);
  readonly editingMediaId = signal<string | null>(null);
  private editingMedia = signal<MediaFile | null>(null);
  readonly form = this.fb.group({ category: ['website'], altText: [''] });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.list<MediaFile>('admin/media-files').subscribe((result) => this.files.set(result.items));
  }

  mediaUrl(url: string): string {
    return this.api.mediaUrl(url);
  }

  editMedia(file: MediaFile): void {
    this.editingMediaId.set(file.id);
    this.editingMedia.set(file);
    this.form.patchValue({ category: file.category, altText: file.altText });
  }

  saveMediaDetails(): void {
    const current = this.editingMedia();
    if (!current) {
      return;
    }

    const { category, altText } = this.form.getRawValue() as { category: string; altText: string };
    this.api.update<MediaFile>('admin/media-files', { ...current, category, altText }).subscribe(() => {
      this.snackBar.open('Media details updated.', 'Close', { duration: 2500 });
      this.resetMediaForm();
      this.load();
    });
  }

  resetMediaForm(): void {
    this.editingMediaId.set(null);
    this.editingMedia.set(null);
    this.form.reset({ category: 'website', altText: '' });
  }

  setAsHero(file: MediaFile): void {
    this.api.list<HeroSection>('admin/hero-sections').subscribe((result) => {
      const activeHero = result.items.find((hero) => hero.isActive) ?? result.items[0];
      const heroPayload = activeHero
        ? ({ ...activeHero, imageUrl: file.url, headline: activeHero.headline || 'Complete Care for Every Pet' } as HeroSection)
        : {
            title: 'PetSense AI',
            headline: 'Complete Care for Every Pet',
            subtitle: 'Track your pet\'s health, create personalized nutrition plans, monitor daily progress, and understand your pet like never before.',
            primaryCtaText: 'Start Tracking',
            secondaryCtaText: 'Create Nutrition Plan',
            imageUrl: file.url,
            isActive: true
          };

      const request: Observable<unknown> = activeHero
        ? this.api.update<HeroSection>('admin/hero-sections', heroPayload as HeroSection)
        : this.api.create<HeroSection>('admin/hero-sections', heroPayload);

      request.subscribe(() => {
        this.snackBar.open('Hero image updated. Refresh the public site to see it.', 'Close', { duration: 3000 });
      });
    });
  }

  deleteMedia(file: MediaFile): void {
    this.api.delete('admin/media-files', file.id).subscribe(() => {
      this.snackBar.open('Media file deleted.', 'Close', { duration: 2500 });
      if (this.editingMediaId() === file.id) {
        this.resetMediaForm();
      }
      this.load();
    });
  }

  upload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    const { category, altText } = this.form.getRawValue() as { category: string; altText: string };
    this.api.uploadMedia(file, category, altText, true).subscribe(() => {
      this.snackBar.open('Media uploaded.', 'Close', { duration: 2500 });
      this.resetMediaForm();
      this.load();
    });
  }
}
