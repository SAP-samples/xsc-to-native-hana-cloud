#!/usr/bin/env node

/**
 * SAP HANA Application Migration Post-Migration Cleanup Script
 * 
 * This script automates all the manual changes required after using
 * the SAP HANA Application Migration Assistant.
 * 
 * Usage: Place this script in the root of your migrated project and run:
 *   node post-migration-cleanup.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Get the root directory (where this script is located)
const ROOT_DIR = __dirname;
const DB_DIR = path.join(ROOT_DIR, 'db');

// Logging helpers
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logSection(title) {
  console.log('');
  log(`${'='.repeat(60)}`, colors.cyan);
  log(title, colors.bright + colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

// Helper to safely delete files or directories
function safeDelete(itemPath, isDirectory = false) {
  try {
    if (fs.existsSync(itemPath)) {
      if (isDirectory) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
      logSuccess(`Deleted: ${path.relative(ROOT_DIR, itemPath)}`);
      return true;
    } else {
      logWarning(`Not found (skipping): ${path.relative(ROOT_DIR, itemPath)}`);
      return false;
    }
  } catch (error) {
    logError(`Failed to delete ${path.relative(ROOT_DIR, itemPath)}: ${error.message}`);
    return false;
  }
}

// Helper to safely read JSON file
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    logError(`Failed to read JSON from ${path.relative(ROOT_DIR, filePath)}: ${error.message}`);
    return null;
  }
}

// Helper to safely write JSON file
function writeJsonFile(filePath, data, prettyPrint = true) {
  try {
    const content = prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    fs.writeFileSync(filePath, content, 'utf8');
    logSuccess(`Updated: ${path.relative(ROOT_DIR, filePath)}`);
    return true;
  } catch (error) {
    logError(`Failed to write JSON to ${path.relative(ROOT_DIR, filePath)}: ${error.message}`);
    return false;
  }
}

// 1. Delete folders and files from db/cfg
function cleanupDbCfg() {
  logSection('Step 1: Cleaning up db/cfg directory');
  
  const cfgDir = path.join(DB_DIR, 'cfg');
  
  // Delete uis folder
  safeDelete(path.join(cfgDir, 'uis'), true);
  
  // Delete synonym-grantor-service files
  safeDelete(path.join(cfgDir, 'synonym-grantor-service.hdbgrants'));
  safeDelete(path.join(cfgDir, 'synonym-grantor-service.hdbsynonymconfig'));
}

// 2. Delete folders from db/src
function cleanupDbSrc() {
  logSection('Step 2: Cleaning up db/src directory');
  
  const srcDir = path.join(DB_DIR, 'src');
  
  // Delete uis and ui folders
  safeDelete(path.join(srcDir, 'uis'), true);
  safeDelete(path.join(srcDir, 'ui'), true);
  
  // Delete synonym-grantor-service.hdbsynonym from models
  safeDelete(path.join(srcDir, 'models', 'synonym-grantor-service.hdbsynonym'));
}

// 3. Create/update synonym-grantor-service.hdbsynonym
function updateSynonymFile() {
  logSection('Step 3: Creating/Updating synonym-grantor-service.hdbsynonym');
  
  const synonymPath = path.join(DB_DIR, 'src', 'synonym-grantor-service.hdbsynonym');
  
  const synonymConfig = {
    "sap.hana.democontent.epm::DUMMY": {
      "target": {
        "schema": "SYS",
        "object": "DUMMY"
      }
    },
    "sap.hana.democontent.epm::M_TIME_DIMENSION": {
      "target": {
        "schema": "_SYS_BI",
        "object": "M_TIME_DIMENSION"
      }
    },
    "M_TIME_DIMENSION": {
      "target": {
        "schema": "_SYS_BI",
        "object": "M_TIME_DIMENSION"
      }
    }
  };
  
  writeJsonFile(synonymPath, synonymConfig);
}

// 4. Update default_access_role.hdbrole
function updateDefaultAccessRole() {
  logSection('Step 4: Updating default_access_role.hdbrole');
  
  const rolePath = path.join(DB_DIR, 'src', 'defaults', 'default_access_role.hdbrole');
  
  const roleData = readJsonFile(rolePath);
  if (!roleData) {
    logWarning(`File not found: ${path.relative(ROOT_DIR, rolePath)}`);
    return;
  }
  
  // Remove the specific role from names array
  const roleToRemove = 'sap.hana.democontent.epm::migration_all_analytic_priv';
  if (roleData.role && roleData.role.schema_roles && roleData.role.schema_roles.length > 0) {
    const schemaRole = roleData.role.schema_roles[0];
    if (schemaRole.names) {
      const originalLength = schemaRole.names.length;
      schemaRole.names = schemaRole.names.filter(name => name !== roleToRemove);

      if (schemaRole.names.length < originalLength) {
        logInfo(`Removed role: ${roleToRemove}`);
        writeJsonFile(rolePath, roleData);
      } else {
        logWarning(`Role not found: ${roleToRemove}`);
      }
    } else {
      logWarning('No names array found in schema_roles');
    }
  } else {
    logWarning('No role.schema_roles array found in file');
  }
}

// 5. Update Admin.hdbrole
function updateAdminRole() {
  logSection('Step 5: Updating db/src/roles/Admin.hdbrole');

  const rolePath = path.join(DB_DIR, 'src', 'roles', 'Admin.hdbrole');

  const roleData = readJsonFile(rolePath);
  if (!roleData) {
    logWarning(`File not found: ${path.relative(ROOT_DIR, rolePath)}`);
    return;
  }

  // Initialize role structure if needed
  if (!roleData.role) {
    roleData.role = {};
  }

  // Add schema privileges (with placeholder for schema name)
  roleData.role.schema_privileges = [
    {
      "reference": "< Schema Name >",
      "privileges": [
        "SELECT METADATA",
        "SELECT CDS METADATA",
        "SELECT",
        "INSERT",
        "EXECUTE",
        "DELETE",
        "UPDATE",
        "CREATE TEMPORARY TABLE"
      ]
    }
  ];
  logInfo('Added schema_privileges with placeholder schema name');

  // Add schema analytic privileges
  roleData.role.schema_analytic_privileges = [
    {
      "schema_reference": "< Schema Name >",
      "privileges": [
        "sap.hana.democontent.epm.models::AP_SALES_ORDER_6",
        "sap.hana.democontent.epm.models::AP_SALES_ORDER",
        "sap.hana.democontent.epm.models::AP_SALES_ORDER_1",
        "sap.hana.democontent.epm.models::AP_SALES_ORDER_2",
        "sap.hana.democontent.epm.models::AP_SALES_ORDER_4",
        "sap.hana.democontent.epm.models::AP_SALES_ORDER_12",
        "sap.hana.democontent.epm.models::AP_SALES_ORDER_3",
        "sap.hana.democontent.epm.models::AP_SALES_ORDER_9",
        "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_2",
        "sap.hana.democontent.epm.models::AP_SALES_ORDER_10",
        "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_PROD_CAT_1",
        "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_3",
        "sap.hana.democontent.epm.models::AP_SALES_ORDER_5",
        "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_1",
        "sap.hana.democontent.epm.models::AP_SALES_ORDER_7",
        "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_PROD_CAT_2",
        "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER",
        "sap.hana.democontent.epm.models::AP_PURCHASE_ORDER_PROD_CAT"
      ]
    }
  ];
  logInfo('Added schema_analytic_privileges with placeholder schema name');

  writeJsonFile(rolePath, roleData);
  logWarning('IMPORTANT: Replace "< Schema Name >" with your actual schema name in Admin.hdbrole');
}

// 6. Create Admin.hdbroleconfig
function createAdminRoleConfig() {
  logSection('Step 6: Creating db/src/roles/Admin.hdbroleconfig');
  
  const configPath = path.join(DB_DIR, 'src', 'roles', 'Admin.hdbroleconfig');
  
  const configData = {
    "sap.hana.democontent.epm.roles::Admin": {
      "< Schema Name >": {
        "schema": "< Schema Name >"
      }
    }
  };
  
  writeJsonFile(configPath, configData);
  logWarning('IMPORTANT: Replace "< Schema Name >" with your actual schema name in Admin.hdbroleconfig');
}

// Main execution
function main() {
  console.clear();
  log('\n' + '='.repeat(60), colors.bright + colors.cyan);
  log('SAP HANA Application Migration - Post-Migration Cleanup', colors.bright + colors.cyan);
  log('='.repeat(60) + '\n', colors.bright + colors.cyan);
  
  logInfo(`Working directory: ${ROOT_DIR}`);
  logInfo(`Database directory: ${DB_DIR}`);
  
  // Check if db directory exists
  if (!fs.existsSync(DB_DIR)) {
    logError(`Database directory not found: ${DB_DIR}`);
    logError('This script must be placed in the root of your migrated project!');
    process.exit(1);
  }
  
  try {
    // Execute all cleanup steps
    cleanupDbCfg();
    cleanupDbSrc();
    updateSynonymFile();
    updateDefaultAccessRole();
    updateAdminRole();
    createAdminRoleConfig();
    
    // Final summary
    logSection('Cleanup Complete!');
    log('\n📝 Important Notes:', colors.bright + colors.yellow);
    log('1. Replace all instances of "< Schema Name >" with your actual schema name in:', colors.yellow);
    log('   - db/src/roles/Admin.hdbrole', colors.yellow);
    log('   - db/src/roles/Admin.hdbroleconfig', colors.yellow);
    log('   - db/src/roles/User.hdbrole', colors.yellow);
    log('\n2. Replace "TRUNCATE" statements with "DELETE FROM" in SQL procedures (.hdbprocedure files)', colors.yellow);
    log('\n3. Grant schema access by executing the SQL commands in Step 7 of the deployment section', colors.yellow);
    log('\n4. Review the changes made to ensure they match your project requirements', colors.yellow);
    log('\n5. Test your deployment after these changes\n', colors.yellow);
    
    logSuccess('Post-migration cleanup completed successfully!');
    
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  cleanupDbCfg,
  cleanupDbSrc,
  updateSynonymFile,
  updateDefaultAccessRole,
  updateAdminRole,
  createAdminRoleConfig
};
