require('dotenv').config({ path: __dirname + "/../.env" });
const { sequelize } = require('../config/database');
const { connectDB } = require('../config/database');

async function deleteAllTables() {
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to PostgreSQL');
    console.log(`📊 Database: ${process.env.DB_NAME || 'memeforgedb'}`);

    // Get all tables
    const [tables] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`
    );

    console.log(`\n📋 Found ${tables.length} tables to delete`);

    // Drop all tables with CASCADE
    for (const table of tables) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${table.table_name}" CASCADE;`);
        console.log(`✅ Dropped table: ${table.table_name}`);
      } catch (error) {
        console.warn(`⚠️  Could not drop table ${table.table_name}:`, error.message);
      }
    }

    // Drop all ENUM types
    try {
      const [enums] = await sequelize.query(
        `SELECT t.typname FROM pg_type t WHERE t.typtype = 'e' AND t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');`
      );

      if (enums.length > 0) {
        console.log(`\n📋 Found ${enums.length} ENUM types to delete`);

        for (const enumType of enums) {
          try {
            await sequelize.query(`DROP TYPE IF EXISTS "${enumType.typname}" CASCADE;`);
            console.log(`✅ Dropped ENUM type: ${enumType.typname}`);
          } catch (error) {
            console.warn(`⚠️  Could not drop ENUM ${enumType.typname}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch ENUM types:', error.message);
    }

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('ℹ️  You can now run: node init-db.js');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database cleanup error:', error.message);
    if (error.parent) {
      console.error('PostgreSQL Error:', error.parent.message);
    }
    process.exit(1);
  }
}

deleteAllTables();
