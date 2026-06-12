import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function run() {
  console.log("Running manual migration...");
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    await sql`
      CREATE TYPE pipeline_stage AS ENUM ('audited', 'contacted', 'demo_built', 'closed_won', 'closed_lost');
    `;
    console.log("Enum created.");
  } catch (e) {
    console.log("Enum likely already exists.");
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        website VARCHAR(255),
        email VARCHAR(255),
        whatsapp VARCHAR(255),
        rating VARCHAR(50),
        reviews_count VARCHAR(50),
        audit_data JSONB,
        pipeline_stage pipeline_stage NOT NULL DEFAULT 'audited',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Table created.");
  } catch (e) {
    console.error("Failed to create table", e);
  }

  console.log("Migration complete!");
}

run();
