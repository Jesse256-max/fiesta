import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

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
const fallbackFilePath = path.join(process.cwd(), 'Backend', 'db', 'mysql_fallback.json');

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

// Security Password Hashing Algorithm Implementation using scrypt + random salt

/**
 * Hashes a password using scrypt with a cryptographically secure 16-byte random salt.
 * Returns formatted string: "<saltHex>:<derivedKeyHex>"
 */
export function hashPassword(password: string, salt?: string): string {
  const saltBuf = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(password, saltBuf, 64);
  return `${saltBuf.toString('hex')}:${derivedKey.toString('hex')}`;
}

/**
 * Computes legacy unsalted SHA-256 hash for backward compatibility.
 */
export function hashPasswordLegacy(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verifies a plain-text password against a stored password hash using timing-safe comparison.
 * Supports scrypt salted format (<salt>:<hash>), legacy SHA-256 (64 hex characters), and plain text.
 */
export function verifyPassword(passwordToVerify: string, storedHash: string): boolean {
  if (!storedHash || !passwordToVerify) return false;

  // 1. Check scrypt format (<saltHex>:<keyHex>)
  if (storedHash.includes(':')) {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [saltHex, keyHex] = parts;
    
    try {
      const saltBuf = Buffer.from(saltHex, 'hex');
      const targetBuf = Buffer.from(keyHex, 'hex');
      const derivedBuf = crypto.scryptSync(passwordToVerify, saltBuf, targetBuf.length);

      if (targetBuf.length !== derivedBuf.length) return false;
      return crypto.timingSafeEqual(targetBuf, derivedBuf);
    } catch {
      return false;
    }
  }

  // 2. Legacy unsalted SHA-256 format (64 hex characters)
  if (/^[0-9a-fA-F]{64}$/.test(storedHash)) {
    const legacyHash = hashPasswordLegacy(passwordToVerify);
    const targetBuf = Buffer.from(storedHash, 'hex');
    const legacyBuf = Buffer.from(legacyHash, 'hex');
    if (targetBuf.length !== legacyBuf.length) return false;
    return crypto.timingSafeEqual(targetBuf, legacyBuf);
  }

  // 3. Direct plaintext fallback (e.g. unhashed initial mock records)
  return storedHash === passwordToVerify;
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
      console.log('[MYSQL] Seeding 5 initial users into MySQL database with scrypt secure password hashes...');
      const insertQuery = `
        INSERT INTO mysql_users (userid, password, name, dob, email, phone)
        VALUES ?
      `;
      const values = fallbackData.map(u => {
        // Hash password with scrypt if it isn't already formatted as scrypt <salt>:<hash>
        const hashedPassword = u.password.includes(':') ? u.password : hashPassword(u.password);
        return [
          u.userid,
          hashedPassword,
          u.name,
          u.dob,
          u.email,
          u.phone
        ];
      });
      await pool.query(insertQuery, [values]);
      console.log('[MYSQL] Successfully seeded 5 users with scrypt password hashes.');
    } else {
      console.log('[MYSQL] Database already contains records. Verifying if password migration to scrypt is required...');
      const [userRows]: any = await pool.query('SELECT id, password FROM mysql_users');
      let migratedCount = 0;
      for (const row of userRows) {
        // Migrate records that are not yet in scrypt salted format (<salt>:<hash>)
        if (!row.password.includes(':')) {
          const scryptHashed = hashPassword(row.password);
          await pool.query('UPDATE mysql_users SET password = ? WHERE id = ?', [scryptHashed, row.id]);
          migratedCount++;
        }
      }
      if (migratedCount > 0) {
        console.log(`[MYSQL] Successfully migrated ${migratedCount} passwords to scrypt secure salted hashes.`);
      } else {
        console.log('[MYSQL] All passwords in active database are already stored as secure scrypt hashes.');
      }
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

  if (useFallback || !pool) {
    console.log('[MYSQL ENGINE: FALLBACK] Verifying credentials via Local JSON fallback store...');
    // Lookup in local fallback data
    const matchedUser = fallbackData.find(u => {
      const dbUserid = (u.userid || '').toLowerCase();
      const dbEmail = (u.email || '').toLowerCase();
      const isMatch = (dbUserid === cleanUserid || dbEmail === cleanEmail);
      if (!isMatch) return false;
      return verifyPassword(passwordToVerify, u.password);
    });

    if (!matchedUser) {
      return null;
    }

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
      SELECT id, userid, password, name, DATE_FORMAT(dob, "%Y-%m-%d") as dob, email, phone 
      FROM mysql_users 
      WHERE LOWER(userid) = ? OR LOWER(email) = ?
      LIMIT 1
    `;
    const [rows]: any = await pool.query(selectQuery, [cleanUserid, cleanEmail]);
    
    if (rows.length === 0) {
      return null;
    }

    const userRow = rows[0];
    const isPasswordValid = verifyPassword(passwordToVerify, userRow.password);

    if (!isPasswordValid) {
      return null;
    }

    // Auto-upgrade legacy stored password format to scrypt upon successful login
    if (!userRow.password.includes(':')) {
      const newScryptHash = hashPassword(passwordToVerify);
      try {
        await pool.query('UPDATE mysql_users SET password = ? WHERE id = ?', [newScryptHash, userRow.id]);
        console.log(`[MYSQL] Automatically upgraded password for user "${userRow.userid}" to secure scrypt format.`);
      } catch (upgErr: any) {
        console.warn(`[MYSQL WARNING] Failed to auto-upgrade password for user "${userRow.userid}":`, upgErr.message);
      }
    }

    delete userRow.password;
    delete userRow.id;
    return userRow;
  } catch (error: any) {
    console.error('[MYSQL ERROR] Failed to query mysql_users table:', error.message);
    throw new Error('Database query failure during authentication.');
  }
}

