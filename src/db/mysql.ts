import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

// Connection configurations
const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'fiesta',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  connectionLimit: 10,
};

let pool: mysql.Pool | null = null;
let useFallback = false;
const fallbackFilePath = path.join(process.cwd(), 'src', 'db', 'mysql_fallback.json');

// Loaded fallback data in case connection fails
let fallbackData: any[] = [];
try {
  if (fs.existsSync(fallbackFilePath)) {
    const raw = fs.readFileSync(fallbackFilePath, 'utf8');
    fallbackData = JSON.parse(raw);
  }
} catch (err) {
  console.error('[MYSQL MOCK] Error reading initial fallback JSON:', err);
}

// Function to initialize MySQL database and verify/create table & seeds
export async function initMysql() {
  try {
    console.log('[MYSQL] Attempting to connect to MySQL database on:', config.host);
    
    // First, connect without database to ensure the database exists
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    await connection.end();

    // Now, create the pool with the specific database
    pool = mysql.createPool(config);

    // Create table if not exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS mysql_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userid VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        dob DATE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL
      )
    `;
    await pool.query(createTableQuery);
    console.log('[MYSQL] Table "mysql_users" checked/created successfully.');

    // Check if table needs seeding
    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM mysql_users');
    const count = rows[0]?.count || 0;

    if (count === 0) {
      console.log('[MYSQL] Seeding 5 initial users into MySQL database...');
      const insertQuery = `
        INSERT INTO mysql_users (userid, password, name, dob, email, phone)
        VALUES ?
      `;
      const values = fallbackData.map(u => [
        u.userid,
        u.password,
        u.name,
        u.dob,
        u.email,
        u.phone
      ]);
      await pool.query(insertQuery, [values]);
      console.log('[MYSQL] Successfully seeded 5 users.');
    } else {
      console.log('[MYSQL] Database already contains records. Skipping seed.');
    }
  } catch (error: any) {
    console.warn('\n[MYSQL WARNING] Failed to initialize MySQL Server connection:', error.message);
    console.warn('[MYSQL WARNING] Falling back to robust file-based/in-memory database engine for mock operations.');
    useFallback = true;
  }
}

// Function to find and verify user credentials
export async function verifyMysqlUser(userid: string, email: string, passwordToVerify: string) {
  const cleanUserid = (userid || '').trim().toLowerCase();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = passwordToVerify || '';

  if (useFallback || !pool) {
    console.log('[MYSQL ENGINE: FALLBACK] Verifying credentials via Local JSON fallback store...');
    // Lookup in local fallback data
    const matchedUser = fallbackData.find(u => {
      const dbUserid = (u.userid || '').toLowerCase();
      const dbEmail = (u.email || '').toLowerCase();
      return (dbUserid === cleanUserid || dbEmail === cleanEmail) && u.password === cleanPassword;
    });

    if (!matchedUser) {
      return null;
    }

    // Format DOB to YYYY-MM-DD
    return {
      userid: matchedUser.userid,
      name: matchedUser.name,
      dob: matchedUser.dob,
      email: matchedUser.email,
      phone: matchedUser.phone
    };
  }

  // Real MySQL connection pool lookup
  try {
    console.log('[MYSQL ENGINE: ACTIVE] Verifying credentials via active MySQL database connection...');
    const selectQuery = `
      SELECT userid, name, DATE_FORMAT(dob, "%Y-%m-%d") as dob, email, phone 
      FROM mysql_users 
      WHERE (LOWER(userid) = ? OR LOWER(email) = ?) AND password = ?
      LIMIT 1
    `;
    const [rows]: any = await pool.query(selectQuery, [cleanUserid, cleanEmail, cleanPassword]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  } catch (error: any) {
    console.error('[MYSQL ERROR] Failed to query mysql_users table:', error.message);
    throw new Error('Database query failure during authentication.');
  }
}
