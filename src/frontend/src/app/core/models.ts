export interface AuditableEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  isDeleted?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface HeroSection extends AuditableEntity {
  title: string;
  headline: string;
  subtitle: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  imageUrl: string;
  isActive: boolean;
}

export interface MarketingItem extends AuditableEntity {
  title: string;
  description: string;
  sortOrder?: number;
  icon?: string;
  isPublished?: boolean;
}

export interface WebsiteSection extends AuditableEntity {
  key: string;
  title: string;
  subtitle: string;
  body: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface HowItWorksStep extends AuditableEntity {
  title: string;
  description: string;
  stepNumber: number;
  isPublished: boolean;
}

export interface TargetCustomer extends AuditableEntity {
  name: string;
  description: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface ComparisonItem extends AuditableEntity {
  capability: string;
  petSenseValue: string;
  traditionalValue: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface Testimonial extends AuditableEntity {
  customerName: string;
  customerRole: string;
  quote: string;
  rating: number;
  isPublished: boolean;
}

export interface WebsiteHome {
  hero: HeroSection | null;
  whyNow: WebsiteSection | null;
  sections?: WebsiteSection[];
  problems: MarketingItem[];
  solutions: MarketingItem[];
  features: MarketingItem[];
  steps: HowItWorksStep[];
  targetCustomers: TargetCustomer[];
  comparison: ComparisonItem[];
  testimonials: Testimonial[];
}

export interface ContactSubmission extends AuditableEntity {
  name: string;
  email: string;
  phone: string;
  petType: string;
  message: string;
  status: string;
}

export interface PetProfile extends AuditableEntity {
  userId?: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
  photoUrl?: string | null;
  allergies: string;
  medicalHistory: string;
  vetName: string;
  vetPhone: string;
}

export interface HealthLog extends AuditableEntity {
  petProfileId: string;
  logDate: string;
  weight?: number | null;
  wellnessScore: number;
  symptoms: string;
  appetite: string;
  hydration: string;
  energyLevel: string;
  notes: string;
}

export interface BehaviorLog extends AuditableEntity {
  petProfileId: string;
  logDate: string;
  eating: string;
  sleeping: string;
  mood: string;
  activity: string;
  bathroomHabits: string;
  symptoms: string;
  unusualBehavior: string;
  notes: string;
}

export interface MedicationReminder extends AuditableEntity {
  petProfileId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  alertTime: string;
  notes: string;
}

export interface Appointment extends AuditableEntity {
  petProfileId: string;
  type: string;
  title: string;
  providerName: string;
  location: string;
  scheduledAt: string;
  status: string;
  notes: string;
}

export interface VaccineRecord extends AuditableEntity {
  petProfileId: string;
  vaccineName: string;
  givenDate: string;
  dueDate?: string | null;
  providerName: string;
  lotNumber: string;
  notes: string;
}

export interface MedicalRecord extends AuditableEntity {
  petProfileId: string;
  title: string;
  recordType: string;
  recordDate: string;
  providerName: string;
  fileUrl: string;
  notes: string;
}

export interface TrainingGuide extends AuditableEntity {
  title: string;
  species: string;
  breed: string;
  ageRange: string;
  concern: string;
  steps: string;
  difficulty: string;
  isPublished: boolean;
}

export interface AiInsight extends AuditableEntity {
  petProfileId: string;
  title: string;
  riskLevel: string;
  recommendation: string;
  nextAction: string;
  sourceSummary: string;
}

export interface ProgressReport extends AuditableEntity {
  petProfileId: string;
  periodStart: string;
  periodEnd: string;
  averageWellnessScore: number;
  behaviorTrend: string;
  healthTrend: string;
  summary: string;
}

export interface Recommendation extends AuditableEntity {
  petProfileId?: string | null;
  category: string;
  title: string;
  body: string;
  triggerRule: string;
  isTemplate: boolean;
}

export interface MediaFile extends AuditableEntity {
  fileName: string;
  contentType: string;
  size: number;
  url: string;
  category: string;
  altText: string;
}

export interface NutritionPlanItem {
  id: string;
  category: string;
  name: string;
  recommendation: string;
  sortOrder: number;
}

export interface NutritionPlan extends AuditableEntity {
  petProfileId: string;
  petType: string;
  breed: string;
  age: number;
  weight: number;
  allergies: string;
  medicalConditions: string;
  activityLevel: string;
  currentFood: string;
  feedingSchedule: string;
  healthGoal: string;
  recommendedFoodType: string;
  mealFrequency: string;
  portionSuggestion: string;
  hydrationReminder: string;
  foodsToAvoid: string;
  allergyNotes: string;
  healthGoalGuidance: string;
  generatedAt: string;
  items: NutritionPlanItem[];
}

export interface DailyProgressLog extends AuditableEntity {
  petProfileId: string;
  logDate: string;
  weight?: number | null;
  mood: string;
  activityLevel: string;
  sleepHours: number;
  foodIntake: string;
  waterIntake: string;
  symptoms: string;
  medicationTaken: boolean;
  trainingProgress: string;
  notes: string;
  wellnessScore: number;
}

export interface DailyProgressSummary {
  petProfileId: string;
  logCount: number;
  latestWellnessScore: number;
  averageWellnessScore: number;
  wellnessDelta: number;
  improvements: string[];
  warnings: string[];
  latestLog?: DailyProgressLog | null;
}

export interface ProgressChartPoint {
  date: string;
  value: number;
  label: string;
}

export interface DailyProgressCharts {
  petProfileId: string;
  daily: ProgressChartPoint[];
  weekly: ProgressChartPoint[];
  monthly: ProgressChartPoint[];
  weight: ProgressChartPoint[];
  sleep: ProgressChartPoint[];
}

export interface WorkflowStepStatus {
  key: string;
  title: string;
  status: 'completed' | 'pending' | 'needs attention';
}

export interface WorkflowStatus {
  steps: WorkflowStepStatus[];
}

export interface WorkflowFinding {
  title: string;
  detail: string;
  status: string;
}

export interface WorkflowAnalysis {
  petProfileId: string;
  petName: string;
  behaviorLogCount: number;
  healthLogCount: number;
  findings: WorkflowFinding[];
  generatedAt: string;
}

export interface ChartPoint {
  date: string;
  value: number;
  label: string;
}

export interface MedicationSummary {
  total: number;
  complete: number;
  active: number;
}

export interface AppointmentSummary {
  date: string;
  title: string;
  status: string;
  notes: string;
}

export interface VaccineSummary {
  vaccineName: string;
  givenDate: string;
  dueDate?: string | null;
  status: string;
}

export interface WorkflowProgress {
  petProfileId: string;
  petName: string;
  wellnessScore: ChartPoint[];
  behaviorTrend: ChartPoint[];
  medicationCompletion: MedicationSummary;
  appointmentHistory: AppointmentSummary[];
  vaccineStatus: VaccineSummary[];
  report: ProgressReport;
}
