-- CreateTable
CREATE TABLE "auto_reply_setting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "use_latest_image" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "attachment_url" TEXT,
    "reply_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_reply_setting_pkey" PRIMARY KEY ("id")
);
