import {
  bigint,
  bigserial,
  serial,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    googleId: varchar("google_id", { length: 255 }).unique(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    whatsappNumber: varchar("whatsapp_number", { length: 20 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    role: varchar("role", { length: 50 }).notNull().default("user"),
    avatarUrl: text("avatar_url"),
    zoomLink: text("zoom_link"),
    isActive: boolean("is_active").notNull().default(true),
    revenueSharePct: numeric("revenue_share_pct", { precision: 5, scale: 2 }).default("70.00"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    check("users_role_check", sql`${t.role} IN ('user', 'instructor', 'admin')`),
    index("idx_users_email").on(t.email),
    index("idx_users_role").on(t.role),
  ],
);

export const categories = pgTable("categories", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable(
  "courses",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    instructorId: bigint("instructor_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    categoryId: bigint("category_id", { mode: "number" }).references(() => categories.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    shortDescription: varchar("short_description", { length: 500 }),
    description: text("description"),
    thumbnailUrl: text("thumbnail_url"),
    promoVideoUrl: text("promo_video_url"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
    originalPrice: numeric("original_price", { precision: 12, scale: 2 }),
    status: varchar("status", { length: 50 }).notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isFree: boolean("is_free").notNull().default(false),
    totalDurationMin: integer("total_duration_min").notNull().default(0),
    enrollmentCount: integer("enrollment_count").notNull().default(0),
    maxStudents: integer("max_students"),
    language: varchar("language", { length: 10 }).notNull().default("id"),
    level: varchar("level", { length: 50 }).notNull().default("beginner"),
    marketingTag: varchar("marketing_tag", { length: 50 }),
    platformFeePct: numeric("platform_fee_pct", { precision: 5, scale: 2 }).notNull().default("30.00"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    check("courses_status_check", sql`${t.status} IN ('draft', 'published', 'archived')`),
    check(
      "courses_level_check",
      sql`${t.level} IN ('beginner', 'intermediate', 'advanced', 'all_levels')`,
    ),
    index("idx_courses_instructor_id").on(t.instructorId),
    index("idx_courses_status").on(t.status),
  ],
);

export const sections = pgTable("sections", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  courseId: bigint("course_id", { mode: "number" })
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessons = pgTable(
  "lessons",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sectionId: bigint("section_id", { mode: "number" })
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    contentType: varchar("content_type", { length: 50 }).notNull().default("youtube_video"),
    youtubeUrl: text("youtube_url"),
    youtubeVideoId: varchar("youtube_video_id", { length: 20 }),
    liveClassUrl: text("live_class_url"),
    liveClassDatetime: timestamp("live_class_datetime", { withTimezone: true }),
    liveClassPlatform: varchar("live_class_platform", { length: 20 }),
    liveClassDurationMin: integer("live_class_duration_min"),
    documentUrl: text("document_url"),
    textContent: text("text_content"),
    description: text("description"),
    durationMinutes: integer("duration_minutes").default(0),
    isFreePreview: boolean("is_free_preview").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    reminderSent24h: boolean("reminder_sent_24h").notNull().default(false),
    reminderSent1h: boolean("reminder_sent_1h").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    check(
      "lessons_content_type_check",
      sql`${t.contentType} IN ('youtube_video', 'live_class', 'document', 'text')`,
    ),
  ],
);

export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    logoUrl: varchar("logo_url", { length: 255 }),
    type: varchar("type", { length: 50 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(),
    adminFeeFlat: bigint("admin_fee_flat", { mode: "number" }).notNull().default(0),
    adminFeePct: numeric("admin_fee_pct", { precision: 5, scale: 2 }).notNull().default("0.00"),
    accountNumber: varchar("account_number", { length: 50 }),
    accountName: varchar("account_name", { length: 100 }),
    isActive: boolean("is_active").notNull().default(true),
    isRedirect: boolean("is_redirect").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "payment_methods_type_check",
      sql`${t.type} IN ('e_wallet', 'va', 'qr_code', 'credit_card', 'retail_outlet', 'manual_transfer')`,
    ),
    check("payment_methods_provider_check", sql`${t.provider} IN ('midtrans', 'xendit', 'manual')`),
  ],
);

export const paymentInstructions = pgTable("payment_instructions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  paymentMethodId: bigint("payment_method_id", { mode: "number" })
    .notNull()
    .references(() => paymentMethods.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coupons = pgTable(
  "coupons",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
    discountType: varchar("discount_type", { length: 20 }).notNull().default("percentage"),
    discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").notNull().default(0),
    minPurchaseAmount: numeric("min_purchase_amount", { precision: 12, scale: 2 }).default("0"),
    applicableCourseId: bigint("applicable_course_id", { mode: "number" }).references(
      () => courses.id,
      { onDelete: "cascade" },
    ),
    isActive: boolean("is_active").notNull().default(true),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    createdBy: bigint("created_by", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("coupons_discount_type_check", sql`${t.discountType} IN ('percentage', 'fixed')`)],
);

export const orders = pgTable(
  "orders",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    courseId: bigint("course_id", { mode: "number" })
      .notNull()
      .references(() => courses.id, { onDelete: "restrict" }),
    paymentMethodId: bigint("payment_method_id", { mode: "number" }).references(
      () => paymentMethods.id,
      { onDelete: "set null" },
    ),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    gatewayTransactionId: varchar("gateway_transaction_id", { length: 255 }).unique(),
    gatewayPaymentUrl: text("gateway_payment_url"),
    vaNumber: varchar("va_number", { length: 50 }),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    adminFee: numeric("admin_fee", { precision: 12, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("IDR"),
    couponCode: varchar("coupon_code", { length: 50 }),
    instructorRevenue: numeric("instructor_revenue", { precision: 12, scale: 2 }),
    platformRevenue: numeric("platform_revenue", { precision: 12, scale: 2 }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "orders_status_check",
      sql`${t.status} IN ('pending', 'awaiting_payment', 'pending_verification', 'paid', 'failed', 'expired', 'refunded', 'cancelled')`,
    ),
    uniqueIndex("idx_orders_user_course_active")
      .on(t.userId, t.courseId)
      .where(sql`${t.status} IN ('pending', 'awaiting_payment', 'pending_verification', 'paid')`),
  ],
);

export const paymentProofs = pgTable("payment_proofs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  orderId: bigint("order_id", { mode: "number" })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }),
  fileSizeBytes: integer("file_size_bytes"),
  mimeType: varchar("mime_type", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  verifiedBy: bigint("verified_by", { mode: "number" }).references(() => users.id, {
    onDelete: "set null",
  }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  rejectionNote: text("rejection_note"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentLogs = pgTable("payment_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  endpoint: varchar("endpoint", { length: 255 }),
  logType: varchar("log_type", { length: 50 }),
  requestPayload: text("request_payload"),
  responsePayload: text("response_payload"),
  httpStatus: integer("http_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    courseId: bigint("course_id", { mode: "number" })
      .notNull()
      .references(() => courses.id, { onDelete: "restrict" }),
    orderId: bigint("order_id", { mode: "number" })
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 50 }).notNull().default("active"),
    progressPct: numeric("progress_pct", { precision: 5, scale: 2 }).notNull().default("0.00"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("idx_enrollments_user_course").on(t.userId, t.courseId)],
);

export const lessonProgress = pgTable("lesson_progress", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lessonId: bigint("lesson_id", { mode: "number" })
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  enrollmentId: bigint("enrollment_id", { mode: "number" })
    .notNull()
    .references(() => enrollments.id, { onDelete: "cascade" }),
  isCompleted: boolean("is_completed").notNull().default(false),
  lastPosition: integer("last_position").default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    eventTrigger: varchar("event_trigger", { length: 100 }).notNull(),
    channel: varchar("channel", { length: 20 }).notNull(),
    messageContent: text("message_content").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_notif_templates_trigger_channel").on(t.eventTrigger, t.channel),
    check("notification_templates_channel_check", sql`${t.channel} IN ('WHATSAPP', 'EMAIL')`),
  ],
);

export const notificationLogs = pgTable("notification_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  templateId: bigint("template_id", { mode: "number" }).references(() => notificationTemplates.id, {
    onDelete: "set null",
  }),
  orderNumber: varchar("order_number", { length: 50 }),
  userId: bigint("user_id", { mode: "number" }).references(() => users.id, { onDelete: "set null" }),
  lessonId: bigint("lesson_id", { mode: "number" }).references(() => lessons.id, {
    onDelete: "set null",
  }),
  recipient: varchar("recipient", { length: 150 }).notNull(),
  channel: varchar("channel", { length: 20 }).notNull(),
  requestPayload: text("request_payload"),
  responsePayload: text("response_payload"),
  status: varchar("status", { length: 20 }).notNull().default("QUEUED"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const webhookLogs = pgTable("webhook_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }),
  provider: varchar("provider", { length: 50 }).notNull(),
  eventType: varchar("event_type", { length: 100 }),
  gatewayTxnId: varchar("gateway_txn_id", { length: 255 }),
  payloadJson: jsonb("payload_json").notNull(),
  signatureValid: boolean("signature_valid").notNull().default(false),
  processingStatus: varchar("processing_status", { length: 50 }).notNull().default("received"),
  errorMessage: text("error_message"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const auditLogs = pgTable("audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  adminId: bigint("admin_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: bigint("entity_id", { mode: "number" }),
  oldValueJson: jsonb("old_value_json"),
  newValueJson: jsonb("new_value_json"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const landingPainPoints = pgTable("landing_pain_points", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  icon: varchar("icon", { length: 50 }).notNull(),
  iconBg: varchar("icon_bg", { length: 20 }).notNull(),
  iconColor: varchar("icon_color", { length: 20 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const landingMethodItems = pgTable(
  "landing_method_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    tab: varchar("tab", { length: 20 }).notNull(),
    icon: varchar("icon", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("landing_method_items_tab_check", sql`${t.tab} IN ('online', 'hybrid')`)],
);

export const testimonials = pgTable("testimonials", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  quote: text("quote").notNull(),
  avatarUrl: text("avatar_url"),
  rating: integer("rating").notNull().default(5),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  question: varchar("question", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonNotes = pgTable(
  "lesson_notes",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: bigint("lesson_id", { mode: "number" })
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex("unq_lesson_notes_user_lesson").on(t.userId, t.lessonId),
  ]
);

export const instructorSlots = pgTable(
  "instructor_slots",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    instructorId: bigint("instructor_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("available"), // available, pending, booked, cancelled
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("instructor_slots_dates_check", sql`${t.endAt} > ${t.startAt}`),
    check("instructor_slots_status_check", sql`${t.status} IN ('available', 'pending', 'booked', 'cancelled')`),
    index("idx_instructor_slots_instructor_start").on(t.instructorId, t.startAt),
  ]
);

export const privateSessions = pgTable(
  "private_sessions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    slotId: bigint("slot_id", { mode: "number" })
      .notNull()
      .references(() => instructorSlots.id, { onDelete: "restrict" }),
    learnerId: bigint("learner_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    instructorId: bigint("instructor_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: bigint("course_id", { mode: "number" })
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    topic: text("topic"),
    instructorNotes: text("instructor_notes"),
    rejectReason: text("reject_reason"),
    zoomLink: text("zoom_link"), // override per session, fallback to users.zoom_link
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, confirmed, completed, no_show, rejected, cancelled
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("private_sessions_status_check", sql`${t.status} IN ('pending', 'confirmed', 'completed', 'no_show', 'rejected', 'cancelled')`),
    index("idx_private_sessions_learner").on(t.learnerId),
    index("idx_private_sessions_instructor").on(t.instructorId),
    uniqueIndex("unq_private_sessions_active_slot").on(t.slotId).where(sql`${t.status} IN ('pending', 'confirmed')`),
    uniqueIndex("unq_private_sessions_active_learner_instructor").on(t.learnerId, t.instructorId).where(sql`${t.status} IN ('pending', 'confirmed')`),
  ]
);
