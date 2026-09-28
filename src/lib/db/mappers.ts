import type {
  Coupon,
  Course,
  Enrollment,
  Lesson,
  Order,
  PaymentInstruction,
  PaymentMethod,
  PaymentProof,
  Section,
  User,
  NotificationLog,
  NotificationTemplate,
} from "@/types/db";
import { asDate, asDateOrNull, asNum } from "./client";

type Row = Record<string, unknown>;

export function mapUser(row: Row): User {
  return {
    id: asNum(row.id),
    googleId: (row.google_id as string) ?? null,
    name: String(row.name),
    email: String(row.email),
    whatsappNumber: (row.whatsapp_number as string) ?? null,
    passwordHash: (row.password_hash as string) ?? null,
    role: row.role as User["role"],
    avatarUrl: (row.avatar_url as string) ?? null,
    isActive: Boolean(row.is_active),
    revenueSharePct: String(row.revenue_share_pct ?? "70.00"),
    lastLoginAt: asDateOrNull(row.last_login_at),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
    deletedAt: asDateOrNull(row.deleted_at),
  };
}

export function mapCourse(row: Row): Course {
  return {
    id: asNum(row.id),
    instructorId: asNum(row.instructor_id),
    categoryId: row.category_id == null ? null : asNum(row.category_id),
    title: String(row.title),
    slug: String(row.slug),
    shortDescription: (row.short_description as string) ?? null,
    description: (row.description as string) ?? null,
    thumbnailUrl: (row.thumbnail_url as string) ?? null,
    promoVideoUrl: (row.promo_video_url as string) ?? null,
    price: String(row.price),
    originalPrice: row.original_price == null ? null : String(row.original_price),
    status: row.status as Course["status"],
    isFeatured: Boolean(row.is_featured),
    isFree: Boolean(row.is_free),
    totalDurationMin: asNum(row.total_duration_min),
    enrollmentCount: asNum(row.enrollment_count),
    maxStudents: row.max_students == null ? null : asNum(row.max_students),
    language: String(row.language),
    level: row.level as Course["level"],
    marketingTag: (row.marketing_tag as string) ?? (row.marketingTag as string) ?? null,
    platformFeePct: String(row.platform_fee_pct),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
    publishedAt: asDateOrNull(row.published_at),
    deletedAt: asDateOrNull(row.deleted_at),
  };
}

export function mapSection(row: Row): Section {
  return {
    id: asNum(row.id),
    courseId: asNum(row.course_id),
    title: String(row.title),
    sortOrder: asNum(row.sort_order),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export function mapLesson(row: Row): Lesson {
  return {
    id: asNum(row.id),
    sectionId: asNum(row.section_id),
    title: String(row.title),
    contentType: row.content_type as Lesson["contentType"],
    youtubeUrl: (row.youtube_url as string) ?? null,
    youtubeVideoId: (row.youtube_video_id as string) ?? null,
    liveClassUrl: (row.live_class_url as string) ?? null,
    liveClassDatetime: asDateOrNull(row.live_class_datetime),
    liveClassPlatform: (row.live_class_platform as Lesson["liveClassPlatform"]) ?? null,
    liveClassDurationMin: row.live_class_duration_min == null ? null : asNum(row.live_class_duration_min),
    documentUrl: (row.document_url as string) ?? null,
    textContent: (row.text_content as string) ?? null,
    description: (row.description as string) ?? null,
    durationMinutes: row.duration_minutes == null ? null : asNum(row.duration_minutes),
    isFreePreview: Boolean(row.is_free_preview),
    sortOrder: asNum(row.sort_order),
    reminderSent24h: Boolean(row.reminder_sent_24h),
    reminderSent1h: Boolean(row.reminder_sent_1h),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
    deletedAt: asDateOrNull(row.deleted_at),
  };
}

export function mapPaymentMethod(row: Row): PaymentMethod {
  return {
    id: asNum(row.id),
    code: String(row.code),
    name: String(row.name),
    logoUrl: ((row.logo_url ?? row.logoUrl) as string) ?? null,
    type: row.type as PaymentMethod["type"],
    provider: row.provider as PaymentMethod["provider"],
    adminFeeFlat: asNum(row.admin_fee_flat),
    adminFeePct: String(row.admin_fee_pct),
    accountNumber: (row.account_number as string) ?? null,
    accountName: (row.account_name as string) ?? null,
    isActive: Boolean(row.is_active),
    isRedirect: Boolean(row.is_redirect),
    sortOrder: asNum(row.sort_order),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export function mapPaymentInstruction(row: Row): PaymentInstruction {
  return {
    id: asNum(row.id),
    paymentMethodId: asNum(row.payment_method_id),
    title: String(row.title),
    content: String(row.content),
    sortOrder: asNum(row.sort_order),
    createdAt: asDate(row.created_at),
  };
}

export function mapCoupon(row: Row): Coupon {
  return {
    id: asNum(row.id),
    code: String(row.code),
    description: (row.description as string) ?? null,
    discountType: row.discount_type as Coupon["discountType"],
    discountValue: String(row.discount_value),
    maxUses: row.max_uses == null ? null : asNum(row.max_uses),
    usedCount: asNum(row.used_count),
    minPurchaseAmount: row.min_purchase_amount == null ? null : String(row.min_purchase_amount),
    applicableCourseId: row.applicable_course_id == null ? null : asNum(row.applicable_course_id),
    isActive: Boolean(row.is_active),
    validFrom: asDateOrNull(row.valid_from),
    validUntil: asDateOrNull(row.valid_until),
    createdBy: row.created_by == null ? null : asNum(row.created_by),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export function mapOrder(row: Row): Order {
  return {
    id: asNum(row.id),
    userId: asNum(row.user_id),
    courseId: asNum(row.course_id),
    paymentMethodId: row.payment_method_id == null ? null : asNum(row.payment_method_id),
    orderNumber: String(row.order_number),
    gatewayTransactionId: (row.gateway_transaction_id as string) ?? null,
    gatewayPaymentUrl: (row.gateway_payment_url as string) ?? null,
    vaNumber: (row.va_number as string) ?? null,
    status: row.status as Order["status"],
    subtotal: String(row.subtotal),
    adminFee: String(row.admin_fee),
    discountAmount: String(row.discount_amount),
    totalAmount: String(row.total_amount),
    currency: String(row.currency),
    couponCode: (row.coupon_code as string) ?? null,
    instructorRevenue: row.instructor_revenue == null ? null : String(row.instructor_revenue),
    platformRevenue: row.platform_revenue == null ? null : String(row.platform_revenue),
    paidAt: asDateOrNull(row.paid_at),
    expiresAt: asDateOrNull(row.expires_at),
    notes: (row.notes as string) ?? null,
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export function mapEnrollment(row: Row): Enrollment {
  return {
    id: asNum(row.id),
    userId: asNum(row.user_id),
    courseId: asNum(row.course_id),
    orderId: asNum(row.order_id),
    status: row.status as Enrollment["status"],
    progressPct: String(row.progress_pct),
    completedAt: asDateOrNull(row.completed_at),
    expiresAt: asDateOrNull(row.expires_at),
    enrolledAt: asDate(row.enrolled_at),
    updatedAt: asDate(row.updated_at),
  };
}

export function mapPaymentProof(row: Row): PaymentProof {
  return {
    id: asNum(row.id),
    orderId: asNum(row.order_id),
    fileUrl: String(row.file_url),
    fileName: (row.file_name as string) ?? null,
    fileSizeBytes: row.file_size_bytes == null ? null : asNum(row.file_size_bytes),
    mimeType: (row.mime_type as string) ?? null,
    status: row.status as PaymentProof["status"],
    verifiedBy: row.verified_by == null ? null : asNum(row.verified_by),
    verifiedAt: asDateOrNull(row.verified_at),
    rejectionNote: (row.rejection_note as string) ?? null,
    uploadedAt: asDate(row.uploaded_at),
  };
}

export function mapNotificationLog(row: Row): NotificationLog {
  return {
    id: asNum(row.id),
    templateId: row.template_id == null ? null : asNum(row.template_id),
    orderNumber: (row.order_number as string) ?? null,
    userId: row.user_id == null ? null : asNum(row.user_id),
    lessonId: row.lesson_id == null ? null : asNum(row.lesson_id),
    recipient: String(row.recipient),
    channel: String(row.channel),
    requestPayload: (row.request_payload as string) ?? null,
    responsePayload: (row.response_payload as string) ?? null,
    status: String(row.status),
    errorMessage: (row.error_message as string) ?? null,
    createdAt: asDate(row.created_at),
    sentAt: asDateOrNull(row.sent_at),
  };
}

export function mapNotificationTemplate(row: Row): NotificationTemplate {
  return {
    id: asNum(row.id),
    eventTrigger: String(row.event_trigger),
    channel: String(row.channel),
    messageContent: String(row.message_content),
    isActive: Boolean(row.is_active),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}
