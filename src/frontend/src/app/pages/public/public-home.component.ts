import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { WebsiteHome } from '../../core/models';
import { SHARED_IMPORTS } from '../../shared/ui';

interface WorkflowCard {
  title: string;
  description: string;
  route: string;
  icon: string;
}

const fallbackHome: WebsiteHome = {
  hero: {
    id: 'fallback-hero',
    title: 'PetSense AI',
    headline: 'Complete Care for Every Pet',
    subtitle: 'Track your pet\'s health, create personalized nutrition plans, monitor daily progress, and understand your pet like never before.',
    primaryCtaText: 'Start Tracking',
    secondaryCtaText: 'Create Nutrition Plan',
    imageUrl: 'assets/petsense-complete-care.png',
    isActive: true
  },
  whyNow: {
    id: 'why-now',
    key: 'why-now',
    title: 'Why Now',
    subtitle: 'Pet care is becoming proactive.',
    body: 'Owners expect the same intelligent tracking for pets that they already use for personal wellness. PetSense AI turns daily observations into safer, earlier decisions.',
    sortOrder: 1,
    isPublished: true
  },
  sections: [
    {
      id: 'complete-care',
      key: 'complete-care',
      title: 'Complete Care for Every Pet',
      subtitle: 'Health, nutrition, daily progress, and wellness in one place.',
      body: 'PetSense AI helps owners provide complete care for every pet with connected profiles, health tracking, nutrition planning, appointments, medication, and AI wellness insights.',
      sortOrder: 3,
      isPublished: true
    },
    {
      id: 'nutrition-plan',
      key: 'nutrition-plan',
      title: 'AI-powered nutrition planning',
      subtitle: 'Personalized feeding guidance for healthier routines.',
      body: 'Create personalized feeding plans from pet type, breed, age, allergies, activity, and goals.',
      sortOrder: 5,
      isPublished: true
    },
    {
      id: 'daily-progress',
      key: 'daily-progress',
      title: 'Daily progress monitoring',
      subtitle: 'See how care decisions affect wellness over time.',
      body: 'See health, behavior, nutrition, medication, training, and wellness trends over time.',
      sortOrder: 6,
      isPublished: true
    }
  ],
  problems: [
    { id: 'p1', title: 'Pets hide symptoms until conditions become serious', description: 'Small changes are easy to miss without a daily care record.' },
    { id: 'p2', title: 'Poor management of health records', description: 'Vaccines, files, allergies, and notes end up scattered.' },
    { id: 'p3', title: 'Owners forget medication and appointments', description: 'Care schedules need reminders and status tracking.' },
    { id: 'p4', title: 'First-time pet parents need training guidance', description: 'Generic advice rarely fits the pet in front of you.' },
    { id: 'p5', title: 'Pets cannot speak human language', description: 'Behavior patterns become the owner\'s best signal.' }
  ],
  solutions: [
    { id: 's1', title: 'Monitor pet behavior', description: 'Track mood, activity, bathroom habits, and unusual behavior.' },
    { id: 's2', title: 'Track health and wellness', description: 'Follow symptoms, weight, energy, and wellness scores.' },
    { id: 's3', title: 'Manage medication and appointments', description: 'Keep care tasks organized with reminders.' },
    { id: 's4', title: 'Provide training guidance', description: 'Get age, breed, and behavior-aware training support.' },
    { id: 's5', title: 'Create complete pet profiles', description: 'One home for records, vet details, photos, and vaccines.' }
  ],
  features: [
    { id: 'f1', title: 'Complete Pet Care', description: 'Manage everything your pet needs in one place, including health, behavior, nutrition, appointments, medication, and progress.', icon: 'health_and_safety' },
    { id: 'f2', title: 'Easy Health Tracking', description: 'Log daily health updates, symptoms, weight, mood, activity, sleep, and wellness changes.', icon: 'monitor_heart' },
    { id: 'f3', title: 'Personalized Nutrition Plan', description: 'Create food and nutrition plans based on pet type, breed, age, weight, allergies, activity level, and health goals.', icon: 'restaurant' },
    { id: 'f4', title: 'Daily Progress Monitoring', description: 'View charts and reports showing your pet\'s health, behavior, nutrition, and wellness progress every day.', icon: 'query_stats' },
    { id: 'f5', title: 'AI Wellness Insights', description: 'Get AI-powered insights and recommendations based on health logs, behavior patterns, nutrition records, and progress reports.', icon: 'auto_awesome' },
    { id: 'f6', title: 'Better Care, Stronger Bond', description: 'Help owners understand their pets better and make smarter care decisions.', icon: 'favorite' }
  ],
  steps: [
    { id: 'h1', title: 'Create pet profile', description: 'Add breed, age, weight, allergies, vet info, vaccines, and records.', stepNumber: 1, isPublished: true },
    { id: 'h2', title: 'Log behavior and health updates', description: 'Track daily eating, sleep, mood, symptoms, and notes.', stepNumber: 2, isPublished: true },
    { id: 'h3', title: 'AI analyzes patterns', description: 'PetSense reviews trends across health, behavior, and medication.', stepNumber: 3, isPublished: true },
    { id: 'h4', title: 'Receive insights and recommendations', description: 'Get risk level, recommendation, and a clear next action.', stepNumber: 4, isPublished: true },
    { id: 'h5', title: 'Track overall progress', description: 'Use reports and charts to see wellness changes over time.', stepNumber: 5, isPublished: true }
  ],
  targetCustomers: [
    { id: 't1', name: 'Pet parents', description: 'A single place for health, behavior, and care routines.', sortOrder: 1, isPublished: true },
    { id: 't2', name: 'First-time owners', description: 'Training and wellness guidance for new pet parents.', sortOrder: 2, isPublished: true },
    { id: 't3', name: 'Multi-pet homes', description: 'Manage multiple schedules, records, and reminders.', sortOrder: 3, isPublished: true },
    { id: 't4', name: 'Veterinary partners', description: 'Clearer owner-provided history for visits.', sortOrder: 4, isPublished: true }
  ],
  comparison: [
    { id: 'c1', capability: 'Health history', petSenseValue: 'Unified profile, logs, records, vaccines', traditionalValue: 'Scattered notes and paper records', sortOrder: 1, isPublished: true },
    { id: 'c2', capability: 'Medication adherence', petSenseValue: 'Reminder schedules with status', traditionalValue: 'Manual memory or calendar only', sortOrder: 2, isPublished: true },
    { id: 'c3', capability: 'Behavior insight', petSenseValue: 'Pattern-based guidance', traditionalValue: 'Guesswork from isolated moments', sortOrder: 3, isPublished: true },
    { id: 'c4', capability: 'Training support', petSenseValue: 'Age, breed, and concern-aware guides', traditionalValue: 'Generic articles', sortOrder: 4, isPublished: true }
  ],
  testimonials: []
};

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <header class="site-nav">
      <a class="brand" routerLink="/">
        <span class="brand-mark">P</span>
        <span>PetSense AI</span>
      </a>
      <nav>
        <a href="#features">Features</a>
        <a href="#complete-care">Complete Care</a>
        <a href="#how">How It Works</a>
        <a href="#waitlist">Waitlist</a>
        <a routerLink="/login">Login</a>
        <a mat-flat-button color="primary" routerLink="/register">Get Started</a>
      </nav>
    </header>

    <main>
      <section class="hero" [style.background-image]="heroBackground()">
        <div class="hero-copy">
          <p class="eyebrow">{{ home().hero?.headline }}</p>
          <h1>{{ home().hero?.title || 'PetSense AI' }}</h1>
          <p class="hero-subtitle">{{ home().hero?.subtitle }}</p>
          <div class="hero-actions">
            <a mat-flat-button color="primary" routerLink="/register">{{ home().hero?.primaryCtaText || 'Start Tracking' }}</a>
            <a mat-stroked-button routerLink="/dashboard/nutrition">{{ home().hero?.secondaryCtaText || 'Create Nutrition Plan' }}</a>
            <a mat-stroked-button routerLink="/dashboard">View Demo</a>
          </div>
        </div>
      </section>

      <section id="complete-care" class="section split-section complete-care-band">
        <div>
          <p class="eyebrow">{{ sectionByKey('complete-care')?.title || 'Complete Care for Every Pet' }}</p>
          <h2>{{ sectionByKey('complete-care')?.subtitle || 'Better care, stronger bond, healthier pets.' }}</h2>
          <p>{{ sectionByKey('complete-care')?.body }}</p>
        </div>
        <div class="solution-list">
          <div class="solution-row"><mat-icon>monitor_heart</mat-icon><div><h3>Easy health tracking</h3><p>Track weight, symptoms, mood, activity, sleep, and wellness changes every day.</p></div></div>
          <div class="solution-row"><mat-icon>restaurant</mat-icon><div><h3>{{ sectionByKey('nutrition-plan')?.title || 'AI-powered nutrition planning' }}</h3><p>{{ sectionByKey('nutrition-plan')?.body || 'Create personalized feeding plans from pet type, breed, age, allergies, activity, and goals.' }}</p></div></div>
          <div class="solution-row"><mat-icon>trending_up</mat-icon><div><h3>{{ sectionByKey('daily-progress')?.title || 'Daily progress monitoring' }}</h3><p>{{ sectionByKey('daily-progress')?.body || 'See health, behavior, nutrition, medication, training, and wellness trends over time.' }}</p></div></div>
        </div>
      </section>

      <section class="section problem-band">
        <div class="section-heading">
          <p class="eyebrow">The Problem</p>
          <h2>Important pet signals are easy to miss.</h2>
        </div>
        <div class="grid cards-five">
          @for (item of home().problems; track item.id; let index = $index) {
            <article class="info-card problem-card">
              <span class="problem-icon">
                <mat-icon>{{ problemIcon(item.title, index) }}</mat-icon>
              </span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </article>
          }
        </div>
      </section>

      <section class="section split-section">
        <div>
          <p class="eyebrow">The Solution</p>
          <h2>Daily care, health records, and AI guidance in one workspace.</h2>
        </div>
        <div class="solution-list">
          @for (item of home().solutions; track item.id) {
            <div class="solution-row">
              <mat-icon>check_circle</mat-icon>
              <div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
            </div>
          }
        </div>
      </section>

      <section id="features" class="section">
        <div class="section-heading">
          <p class="eyebrow">Features</p>
          <h2>Everything owners need to understand and care for their pets.</h2>
        </div>
        <div class="grid feature-grid">
          @for (feature of homepageFeatures(); track feature.id || feature.title) {
            <article class="feature-card">
              <mat-icon>{{ feature.icon || 'pets' }}</mat-icon>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </article>
          }
        </div>
      </section>

      <section id="how" class="section how-band">
        <div class="section-heading">
          <p class="eyebrow">How It Works</p>
          <h2>From daily logs to better decisions.</h2>
        </div>
        <div class="steps">
          @for (step of workflowCards(); track step.route; let index = $index) {
            <a class="step workflow-card" [routerLink]="step.route">
              <span>{{ index + 1 }}</span>
              <mat-icon>{{ step.icon }}</mat-icon>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
              <strong>Open step <mat-icon>arrow_forward</mat-icon></strong>
            </a>
          }
        </div>
      </section>

      <section class="section split-section now-section">
        <div>
          <p class="eyebrow">{{ home().whyNow?.title || 'Why Now' }}</p>
          <h2>{{ home().whyNow?.subtitle }}</h2>
        </div>
        <p>{{ home().whyNow?.body }}</p>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">Target Customers</p>
          <h2>Designed for the people responsible for daily care.</h2>
        </div>
        <div class="grid customer-grid">
          @for (customer of home().targetCustomers; track customer.id) {
            <article class="info-card">
              <h3>{{ customer.name }}</h3>
              <p>{{ customer.description }}</p>
            </article>
          }
        </div>
      </section>

      <section class="section comparison-section">
        <div class="section-heading">
          <p class="eyebrow">Comparison</p>
          <h2>PetSense AI replaces fragmented care tracking.</h2>
        </div>
        <div class="comparison-table">
          <div class="comparison-head">
            <span>Capability</span>
            <span>PetSense AI</span>
            <span>Traditional Tracking</span>
          </div>
          @for (row of home().comparison; track row.id) {
            <div class="comparison-row">
              <strong>{{ row.capability }}</strong>
              <span>{{ row.petSenseValue }}</span>
              <span>{{ row.traditionalValue }}</span>
            </div>
          }
        </div>
      </section>

      <section id="waitlist" class="section waitlist-section">
        <div>
          <p class="eyebrow">Contact</p>
          <h2>Join the PetSense AI waitlist.</h2>
          <p>Tell us about your pet and we will follow up with early access updates.</p>
        </div>
        <form class="waitlist-form" [formGroup]="waitlistForm" (ngSubmit)="submitWaitlist()">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Pet type</mat-label>
            <mat-select formControlName="petType">
              <mat-option value="Dog">Dog</mat-option>
              <mat-option value="Cat">Cat</mat-option>
              <mat-option value="Both">Both</mat-option>
              <mat-option value="Other">Other</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-field">
            <mat-label>Message</mat-label>
            <textarea matInput formControlName="message" rows="3"></textarea>
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="waitlistForm.invalid || submitting()">Join Waitlist</button>
        </form>
      </section>
    </main>

    <footer class="site-footer">
      <span>PetSense AI</span>
      <span>Understand Your Pet Like Never Before.</span>
    </footer>
  `
})
export class PublicHomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly home = signal<WebsiteHome>(fallbackHome);
  readonly submitting = signal(false);
  private readonly workflowRoutes: WorkflowCard[] = [
    {
      title: 'Create Your Pet Profile',
      description: 'Add pet identity, photo, health background, vaccines, and vet details.',
      route: '/dashboard/workflow/profile',
      icon: 'pets'
    },
    {
      title: 'Log 1: Behavior and Health Updates',
      description: 'Record eating, sleep, mood, activity, symptoms, bathroom habits, and notes.',
      route: '/dashboard/workflow/daily-log',
      icon: 'edit_note'
    },
    {
      title: 'Log 2: Pattern Analyzing AI Site',
      description: 'Review repeated symptoms, care changes, and wellness trends from saved logs.',
      route: '/dashboard/workflow/analysis',
      icon: 'psychology'
    },
    {
      title: 'Log 3: Insight and Recommendation',
      description: 'Generate risk level, recommendation, and next action from real pet data.',
      route: '/dashboard/workflow/insights',
      icon: 'auto_awesome'
    },
    {
      title: 'Log 4: Tracker for Overall Progress',
      description: 'Track wellness, behavior, medication, appointments, vaccines, and health progress.',
      route: '/dashboard/workflow/progress',
      icon: 'query_stats'
    }
  ];

  readonly waitlistForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    petType: ['Dog', Validators.required],
    message: ['']
  });

  ngOnInit(): void {
    this.api.websiteHome().subscribe({
      next: (home) => this.home.set({ ...fallbackHome, ...home }),
      error: () => this.home.set(fallbackHome)
    });
  }

  heroBackground(): string {
    const image = this.home().hero?.imageUrl || 'assets/petsense-complete-care.png';
    const normalized = this.api.mediaUrl(image);
    return `linear-gradient(90deg, rgba(247, 252, 249, 0.9) 0%, rgba(247, 252, 249, 0.58) 34%, rgba(247, 252, 249, 0.08) 68%), url("${normalized}")`;
  }

  homepageFeatures() {
    const requested = fallbackHome.features;
    return requested.map((item) => {
      const managed = this.home().features.find((feature) => feature.title.toLowerCase() === item.title.toLowerCase());
      return managed ? { ...item, ...managed } : item;
    });
  }

  problemIcon(title: string, index: number): string {
    const normalized = title.toLowerCase();

    if (normalized.includes('symptom')) {
      return 'monitor_heart';
    }

    if (normalized.includes('record')) {
      return 'folder_special';
    }

    if (normalized.includes('medication') || normalized.includes('appointment')) {
      return 'event_available';
    }

    if (normalized.includes('training')) {
      return 'school';
    }

    if (normalized.includes('speak') || normalized.includes('language')) {
      return 'psychology';
    }

    return ['pets', 'health_and_safety', 'event_note', 'school', 'psychology'][index] || 'pets';
  }

  workflowCards(): WorkflowCard[] {
    return this.workflowRoutes.map((card, index) => {
      const managedStep = this.home().steps.find((step) => step.stepNumber === index + 1) ?? this.home().steps[index];
      return {
        ...card,
        description: managedStep?.description || card.description
      };
    });
  }

  sectionByKey(key: string) {
    return (this.home().sections ?? fallbackHome.sections ?? []).find((section) => section.key === key);
  }

  submitWaitlist(): void {
    if (this.waitlistForm.invalid) {
      this.waitlistForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.api.joinWaitlist({ ...this.waitlistForm.getRawValue(), status: 'New' }).subscribe({
      next: () => {
        this.snackBar.open('You are on the PetSense AI waitlist.', 'Close', { duration: 3500 });
        this.waitlistForm.reset({ name: '', email: '', phone: '', petType: 'Dog', message: '' });
        this.submitting.set(false);
      },
      error: () => {
        this.snackBar.open('Waitlist submission could not be saved yet.', 'Close', { duration: 3500 });
        this.submitting.set(false);
      }
    });
  }
}
