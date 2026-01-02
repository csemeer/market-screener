/**
 * Initialize Database - Create all tables
 */

import '../src/services/databaseService';
import { databaseService } from '../src/services/databaseService';

async function initDatabase() {
  console.log('🗄️  Initializing database...\n');

  try {
    // The database service will create all tables on initialization
    await databaseService.initialize();

    console.log('✅ Database initialized successfully!');
    console.log('   All tables created.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
