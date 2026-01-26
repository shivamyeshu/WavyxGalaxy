-- CreateTable
CREATE TABLE "published_workflows" (
    "id" TEXT NOT NULL,
    "workflow_id" INTEGER NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "data" JSONB NOT NULL,
    "share_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "published_workflows_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "published_workflows_share_id_key" ON "published_workflows"("share_id");
CREATE INDEX "published_workflows_user_id_idx" ON "published_workflows"("user_id");

-- Foreign keys
ALTER TABLE "published_workflows" ADD CONSTRAINT "published_workflows_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "published_workflows" ADD CONSTRAINT "published_workflows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
