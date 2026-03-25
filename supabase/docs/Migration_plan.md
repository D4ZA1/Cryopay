Cryopay Migration Plan: Supabase to Cloudflare D1 + Workers
Executive Summary
Cryopay is a cryptocurrency wallet application built on Supabase with a React frontend. The current architecture includes:

Supabase Backend: PostgreSQL database with authentication, real-time capabilities, and edge functions
React Frontend: TypeScript-based application with Tailwind CSS and complex wallet management features
Database Schema: Profiles, Wallets, Blocks (blockchain), and Contacts tables with Row Level Security
Authentication: Supabase Auth with JWT tokens and user metadata
Security: Client-side encryption using WebCrypto API for wallet keys and transaction data
Migration Objectives and Goals
Primary Objectives
Cost Optimization: Reduce operational costs by migrating from Supabase to Cloudflare's serverless platform
Performance Improvement: Leverage Cloudflare's global edge network for faster response times
Scalability: Prepare for increased user load with Cloudflare's auto-scaling capabilities
Maintain Security: Preserve all existing security features including encryption and authentication
Technical Goals
Database Migration: Convert PostgreSQL schema to Cloudflare D1 (SQLite-based)
Authentication Migration: Replace Supabase Auth with Cloudflare Access or custom JWT solution
Function Migration: Convert Supabase Edge Functions to Cloudflare Workers
API Integration: Update frontend to use new D1 database and Workers API
Zero Downtime: Ensure seamless transition with minimal user impact
Detailed Migration Strategy
Phase 1: Preparation and Analysis
Schema Analysis: Review current PostgreSQL schema and identify D1-compatible structures
Dependency Mapping: Document all Supabase-specific dependencies and integrations
Environment Setup: Configure Cloudflare account and prepare D1 databases
Migration Tools: Set up data migration scripts and validation tools
Phase 2: Database Migration
Schema Conversion: Convert PostgreSQL DDL to SQLite-compatible DDL
Data Migration: Export data from Supabase and import to D1
Index Optimization: Create appropriate indexes for SQLite performance
Security Configuration: Implement Row Level Security equivalents in D1
Phase 3: Backend Migration
Function Conversion: Rewrite Supabase Edge Functions as Cloudflare Workers
Authentication Setup: Implement Cloudflare Access or custom JWT authentication
API Gateway: Configure Workers for API routing and request handling
Service Integration: Update external API integrations for Cloudflare environment
Phase 4: Frontend Migration
Client Library Updates: Replace Supabase client with D1 client and Workers API calls
Configuration Updates: Update environment variables and connection strings
Testing: Comprehensive testing of all frontend functionality
Deployment: Deploy updated frontend to production
Phase 5: Validation and Cutover
Data Validation: Verify data integrity between old and new systems
Performance Testing: Benchmark performance improvements
User Acceptance Testing: Validate functionality with real users
DNS Cutover: Switch traffic from Supabase to Cloudflare
Database Migration Plan
Current Schema Analysis
Tables to Migrate
Profiles Table: User profile information with cryptographic keys
Wallets Table: Wallet information and verification status
Blocks Table: Blockchain transaction storage
Contacts Table: User-specific contact information
Schema Conversion Considerations
Data Types: Convert PostgreSQL-specific types to SQLite equivalents
JSONB Support: Use SQLite JSON1 extension for JSONB functionality
UUID Handling: Ensure proper UUID support in SQLite
Triggers: Convert PostgreSQL triggers to SQLite triggers
Migration Steps
Step 1: Schema Preparation
-- Example D1 schema conversion
CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    public_key TEXT,
    encrypted_private_key TEXT,
    email TEXT,
    phone TEXT,
    notifications TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallets (
    user_id TEXT PRIMARY KEY,
    public_key TEXT,
    encrypted_private_key TEXT,
    verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    previous_hash TEXT,
    hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);

CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    contact_user_id TEXT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    email TEXT,
    label TEXT,
    public_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
Step 2: Data Migration Script
// Migration script using Supabase client and D1 client
import { createClient } from '@supabase/supabase-js';
import { D1Client } from '@cloudflare/d1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const d1 = new D1Client({
    accountId: CLOUDFLARE_ACCOUNT_ID,
    database: 'cryopay',
});

async function migrateData() {
    // Migrate profiles
    const { data: profiles } = await supabase.from('profiles').select('*');
    for (const profile of profiles) {
        await d1.exec(`
            INSERT INTO profiles (id, first_name, last_name, public_key, encrypted_private_key, email, phone, notifications, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            profile.id,
            profile.first_name,
            profile.last_name,
            JSON.stringify(profile.public_key),
            JSON.stringify(profile.encrypted_private_key),
            profile.email,
            profile.phone,
            JSON.stringify(profile.notifications),
            profile.created_at,
            profile.updated_at
        ]);
    }
    
    // Migrate wallets
    const { data: wallets } = await supabase.from('wallets').select('*');
    for (const wallet of wallets) {
        await d1.exec(`
            INSERT INTO wallets (user_id, public_key, encrypted_private_key, verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            wallet.user_id,
            JSON.stringify(wallet.public_key),
            JSON.stringify(wallet.encrypted_private_key),
            wallet.verified,
            wallet.created_at,
            wallet.updated_at
        ]);
    }
    
    // Migrate blocks
    const { data: blocks } = await supabase.from('blocks').select('*');
    for (const block of blocks) {
        await d1.exec(`
            INSERT INTO blocks (id, data, previous_hash, hash, created_at, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            block.id,
            JSON.stringify(block.data),
            block.previous_hash,
            block.hash,
            block.created_at,
            block.user_id
        ]);
    }
    
    // Migrate contacts
    const { data: contacts } = await supabase.from('contacts').select('*');
    for (const contact of contacts) {
        await d1.exec(`
            INSERT INTO contacts (user_id, contact_user_id, name, address, email, label, public_key, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            contact.user_id,
            contact.contact_user_id,
            contact.name,
            contact.address,
            contact.email,
            contact.label,
            JSON.stringify(contact.public_key),
            contact.created_at,
            contact.updated_at
        ]);
    }
}
Frontend Migration Plan
Current Architecture Analysis
Framework: React with TypeScript
State Management: React Context for authentication
Styling: Tailwind CSS
Routing: React Router
API Integration: Supabase client for database operations
Migration Steps
Step 1: Client Library Updates
// Replace Supabase client with D1 client
import { D1Client } from '@cloudflare/d1';
import { createWorkerClient } from './workers/apiClient';

const d1 = new D1Client({
    accountId: CLOUDFLARE_ACCOUNT_ID,
    database: 'cryopay',
});

const workerClient = createWorkerClient({
    accountId: CLOUDFLARE_ACCOUNT_ID,
    workerUrl: 'https://cryopay.cloudflareworkers.com',
});

// Update API calls
export const api = {
    getProfile: async (userId: string) => {
        const result = await d1.exec(`
            SELECT * FROM profiles WHERE id = ?
        `, [userId]);
        return result.rows[0];
    },
    
    updateProfile: async (userId: string, data: any) => {
        const result = await d1.exec(`
            UPDATE profiles 
            SET first_name = ?, last_name = ?, email = ?, phone = ?, notifications = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING *
        `, [
            data.first_name,
            data.last_name,
            data.email,
            data.phone,
            JSON.stringify(data.notifications),
            userId
        ]);
        return result.rows[0];
    },
    
    // Worker-based operations
    verifyWallet: async (data: any) => {
        return workerClient.post('/api/verify-wallet', data);
    },
    createProfileWallet: async (data: any) => {
        return workerClient.post('/api/create-profile-wallet', data);
    }
};
Step 2: Authentication Migration
// Replace Supabase Auth with Cloudflare Access or custom JWT
import { createClient } from '@cloudflare/access';

const accessClient = createClient({
    accountId: CLOUDFLARE_ACCOUNT_ID,
    application: 'cryopay',
});

// Custom JWT implementation
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

export const auth = {
    login: async (credentials: any) => {
        // Implement custom authentication logic
        const token = jwt.sign({
            userId: credentials.userId,
            email: credentials.email,
            // Add other claims as needed
        }, jwtSecret, { expiresIn: '24h' });
        
        return { token, user: credentials };
    },
    
    verify: async (token: string) => {
        try {
            const decoded = jwt.verify(token, jwtSecret);
            return decoded;
        } catch (error) {
            return null;
        }
    },
    
    logout: async () => {
        // Implement logout logic
        return true;
    }
};
Risk Assessment and Mitigation
Technical Risks
Data Loss During Migration

Mitigation: Implement comprehensive backup strategy and data validation
Backup: Export all data before migration
Validation: Compare row counts and checksums between systems
Performance Degradation

Mitigation: Conduct thorough performance testing before cutover
Benchmarking: Establish baseline performance metrics
Optimization: Optimize D1 queries and Workers functions
Authentication Issues

Mitigation: Implement fallback authentication mechanisms
Testing: Test authentication flows extensively
Monitoring: Set up real-time monitoring for authentication failures
Business Risks
User Experience Disruption

Mitigation: Implement gradual rollout with feature flags
Communication: Notify users about planned maintenance
Support: Provide enhanced support during migration
Security Vulnerabilities

Mitigation: Conduct security audit of new architecture
Testing: Penetration testing of migrated system
Monitoring: Implement security monitoring and alerting
Timeline and Milestones
Phase 1: Preparation (2 weeks)
Week 1: Schema analysis and dependency mapping
Week 2: Environment setup and migration tool development
Phase 2: Database Migration (3 weeks)
Week 3: Schema conversion and initial data export
Week 4: Data import and validation
Week 5: Index optimization and security configuration
Phase 3: Backend Migration (4 weeks)
Week 6: Function conversion and authentication setup
Week 7: API gateway configuration
Week 8: Service integration and testing
Week 9: Performance optimization
Phase 4: Frontend Migration (3 weeks)
Week 10: Client library updates and configuration
Week 11: Testing and bug fixes
Week 12: Deployment preparation
Phase 5: Validation and Cutover (2 weeks)
Week 13: Data validation and performance testing
Week 14: User acceptance testing and DNS cutover
Total Timeline: 14 weeks (approximately 3.5 months)

Testing Strategy
Unit Testing
Database Functions: Test all D1 queries and operations
Workers Functions: Test all Cloudflare Workers functionality
Authentication: Test all authentication flows
Integration Testing
End-to-End Testing: Test complete user workflows
Performance Testing: Load testing of new architecture
Security Testing: Penetration testing and vulnerability scanning
User Acceptance Testing
Beta Testing: Limited rollout to select users
Feedback Collection: Gather user feedback and issues
Bug Fixes: Address reported issues before full rollout
Rollback Plan
Immediate Rollback
DNS Switchback: Revert DNS to Supabase
Database Switch: Switch back to Supabase database
Frontend Update: Deploy rollback version of frontend
Data Recovery
Backup Restoration: Restore from pre-migration backups
Data Validation: Verify data integrity after restoration
User Notification: Inform users about rollback
Timeline
Rollback Decision: Within 1 hour of issue detection
Complete Rollback: Within 4 hours of decision
User Impact: Minimal to none
Post-Migration Considerations
Monitoring and Maintenance
Performance Monitoring: Set up monitoring for response times and error rates
Cost Monitoring: Track Cloudflare costs vs. Supabase costs
Security Monitoring: Implement security monitoring and alerting
Optimization
Query Optimization: Continuously optimize D1 queries
Workers Optimization: Optimize Workers for better performance
Caching Strategy: Implement appropriate caching mechanisms
Documentation Updates
Architecture Documentation: Update system architecture documentation
API Documentation: Update API documentation for new endpoints
Deployment Guides: Update deployment and maintenance procedures
Team Training
Cloudflare Training: Train team on Cloudflare platform
D1 Training: Train team on D1 database management
Security Training: Update security practices for new architecture
This comprehensive migration plan provides a structured approach to migrating Cryopay from Supabase to Cloudflare D1 + Workers. The plan addresses technical, business, and security considerations while providing clear timelines, risk mitigation strategies, and rollback procedures. Regular communication with stakeholders and thorough testing at each phase will be critical to the success of this migration.