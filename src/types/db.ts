export type UserRole = "user" | "instructor" | "admin";
export type CourseStatus = "draft" | "published" | "archived";
export type CourseLevel = "beginner" | "intermediate" | "advanced" | "all_levels";
export type PaymentMethodType =
  | "e_wallet"
  | "va"
  | "qr_code"
  | "credit_card"
  | "retail_outlet"
  | "manual_transfer";
export type PaymentProvider = "midtrans" | "xendit" | "manual";
export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "pending_verification"
  | "paid"
  | "failed"
  | "expired"
  | "refunded"
  | "cancelled";

export interface User {
  id: number;
  googleId: string | null;
  name: string;
  email: string;
  whatsappNumber: string | null;
  passwordHash: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  revenueSharePct: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface Course {
  id: number;
  instructorId: number;
  categoryId: number | null;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  promoVideoUrl: string | null;
  price: string;
  originalPrice: string | null;
  status: CourseStatus;
  isFeatured: boolean;
  isFree: boolean;
  totalDurationMin: number;
  enrollmentCount: number;
  maxStudents: number | null;
  language: string;
  level: CourseLevel;
  marketingTag: string | null;
  platformFeePct: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  deletedAt: Date | null;
}

export interface Section {
  id: number;
  courseId: number;
  title: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: number;
  sectionId: number;
  title: string;
  contentType: "youtube_video" | "live_class" | "document" | "text";
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  liveClassUrl: string | null;
  liveClassDatetime: Date | null;
  liveClassPlatform: "zoom" | "gmeet" | null;
  liveClassDurationMin: number | null;
  documentUrl: string | null;
  textContent: string | null;
  description: string | null;
  durationMinutes: number | null;
  isFreePreview: boolean;
  sortOrder: number;
  reminderSent24h: boolean;
  reminderSent1h: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PaymentMethod {
  id: number;
  code: string;
  name: string;
  logoUrl: string | null;
  type: PaymentMethodType;
  provider: PaymentProvider;
  adminFeeFlat: number;
  adminFeePct: string;
  accountNumber: string | null;
  accountName: string | null;
  isActive: boolean;
  isRedirect: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInstruction {
  id: number;
  paymentMethodId: number;
  title: string;
  content: string;
  sortOrder: number;
  createdAt: Date;
}

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: string;
  maxUses: number | null;
  usedCount: number;
  minPurchaseAmount: string | null;
  applicableCourseId: number | null;
  isActive: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: number;
  userId: number;
  courseId: number;
  paymentMethodId: number | null;
  orderNumber: string;
  gatewayTransactionId: string | null;
  gatewayPaymentUrl: string | null;
  vaNumber: string | null;
  status: OrderStatus;
  subtotal: string;
  adminFee: string;
  discountAmount: string;
  totalAmount: string;
  currency: string;
  couponCode: string | null;
  instructorRevenue: string | null;
  platformRevenue: string | null;
  paidAt: Date | null;
  expiresAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentProof {
  id: number;
  orderId: number;
  fileUrl: string;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  status: "pending" | "approved" | "rejected";
  verifiedBy: number | null;
  verifiedAt: Date | null;
  rejectionNote: string | null;
  uploadedAt: Date;
}

export interface PaymentLog {
  id: number;
  orderNumber: string;
  endpoint: string | null;
  logType: string | null;
  requestPayload: string | null;
  responsePayload: string | null;
  httpStatus: number | null;
  createdAt: Date;
}

export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  orderId: number;
  status: "active" | "expired" | "revoked";
  progressPct: string;
  completedAt: Date | null;
  expiresAt: Date | null;
  enrolledAt: Date;
  updatedAt: Date;
}

export interface PublishedCourseCard extends Course {
  instructorName: string;
}

export interface SiteSetting {
  id: number;
  key: string;
  value: string;
  updatedAt: Date;
}

export interface LandingPainPoint {
  id: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LandingMethodItem {
  id: number;
  tab: "online" | "hybrid";
  icon: string;
  title: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  avatarUrl: string | null;
  rating: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookLog {
  id: number;
  orderNumber: string | null;
  provider: "midtrans" | "xendit";
  eventType: string | null;
  gatewayTxnId: string | null;
  payloadJson: unknown;
  signatureValid: boolean;
  processingStatus: "received" | "processed" | "failed" | "duplicate";
  errorMessage: string | null;
  receivedAt: Date;
  processedAt: Date | null;
}

export interface NotificationLog {
  id: number;
  templateId: number | null;
  orderNumber: string | null;
  userId: number | null;
  lessonId: number | null;
  recipient: string;
  channel: string;
  requestPayload: string | null;
  responsePayload: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
  sentAt: Date | null;
}

export interface NotificationTemplate {
  id: number;
  eventTrigger: string;
  channel: string;
  messageContent: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
