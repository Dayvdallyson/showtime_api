-- CreateTable
CREATE TABLE "movies" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "genre" VARCHAR(50) NOT NULL,
    "year" INTEGER NOT NULL,
    "synopsis" TEXT,
    "poster_url" TEXT,
    "accent" CHAR(7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);
