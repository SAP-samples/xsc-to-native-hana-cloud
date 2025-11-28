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

// Helper to find all files recursively
function findFilesRecursive(dir, extension) {
  let results = [];
  try {
    if (!fs.existsSync(dir)) {
      return results;
    }
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(findFilesRecursive(fullPath, extension));
      } else if (fullPath.endsWith(extension)) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    logError(`Error scanning directory ${dir}: ${error.message}`);
  }
  return results;
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
  if (roleData.role && roleData.role.names) {
    const originalLength = roleData.role.names.length;
    roleData.role.names = roleData.role.names.filter(name => name !== roleToRemove);
    
    if (roleData.role.names.length < originalLength) {
      logInfo(`Removed role: ${roleToRemove}`);
      writeJsonFile(rolePath, roleData);
    } else {
      logWarning(`Role not found: ${roleToRemove}`);
    }
  } else {
    logWarning('No role.names array found in file');
  }
}

// 5. Update PURCHASE_COMMON_CURRENCY.hdbcalculationview
function updateCalculationView() {
  logSection('Step 5: Updating PURCHASE_COMMON_CURRENCY.hdbcalculationview');
  
  const viewPath = path.join(DB_DIR, 'src', 'models', 'PURCHASE_COMMON_CURRENCY.hdbcalculationview');
  
  try {
    if (!fs.existsSync(viewPath)) {
      logWarning(`File not found: ${path.relative(ROOT_DIR, viewPath)}`);
      return;
    }
    
    let content = fs.readFileSync(viewPath, 'utf8');
    
    // Update currencyConversionTables attributes
    const oldPattern = /<currencyConversionTables[^>]*>/;
    const newContent = '<currencyConversionTables rates="sap.hana.democontent.epm.data::Conversions.TCURR" configuration="sap.hana.democontent.epm.data::Conversions.TCURV" prefactors="sap.hana.democontent.epm.data::Conversions.TCURF" notations="sap.hana.democontent.epm.data::Conversions.TCURN" precisions="sap.hana.democontent.epm.data::Conversions.TCURX"/>';
    
    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, newContent);
      fs.writeFileSync(viewPath, content, 'utf8');
      logSuccess(`Updated: ${path.relative(ROOT_DIR, viewPath)}`);
    } else {
      logWarning('currencyConversionTables tag not found in file');
    }
  } catch (error) {
    logError(`Failed to update calculation view: ${error.message}`);
  }
}

// 6. Update User.hdbrole
function updateUserRole() {
  logSection('Step 6: Updating db/src/roles/User.hdbrole');
  
  const rolePath = path.join(DB_DIR, 'src', 'roles', 'User.hdbrole');
  
  const roleData = readJsonFile(rolePath);
  if (!roleData) {
    logWarning(`File not found: ${path.relative(ROOT_DIR, rolePath)}`);
    return;
  }
  
  // Remove specific schema privileges
  const referencesToRemove = ['_SYS_BIC', '_SYS_REPO', '_SYS_RT'];
  
  if (roleData.role && roleData.role.schema_privileges) {
    const originalLength = roleData.role.schema_privileges.length;
    roleData.role.schema_privileges = roleData.role.schema_privileges.filter(
      privilege => !referencesToRemove.includes(privilege.reference)
    );
    
    if (roleData.role.schema_privileges.length < originalLength) {
      logInfo(`Removed ${originalLength - roleData.role.schema_privileges.length} schema privilege(s)`);
      writeJsonFile(rolePath, roleData);
    } else {
      logWarning('No matching schema privileges found to remove');
    }
  } else {
    logWarning('No schema_privileges found in file');
  }
}

// 7. Update Admin.hdbrole
function updateAdminRole() {
  logSection('Step 7: Updating db/src/roles/Admin.hdbrole');
  
  const rolePath = path.join(DB_DIR, 'src', 'roles', 'Admin.hdbrole');
  
  const roleData = readJsonFile(rolePath);
  if (!roleData) {
    logWarning(`File not found: ${path.relative(ROOT_DIR, rolePath)}`);
    return;
  }
  
  let modified = false;
  
  // Remove REPOSITORY_REST procedure privilege
  if (roleData.role && roleData.role.object_privileges) {
    const originalLength = roleData.role.object_privileges.length;
    roleData.role.object_privileges = roleData.role.object_privileges.filter(
      privilege => privilege.name !== 'REPOSITORY_REST'
    );
    
    if (roleData.role.object_privileges.length < originalLength) {
      logInfo('Removed REPOSITORY_REST procedure privilege');
      modified = true;
    }
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
  modified = true;
  
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
  modified = true;
  
  if (modified) {
    writeJsonFile(rolePath, roleData);
    logWarning('IMPORTANT: Replace "< Schema Name >" with your actual schema name in Admin.hdbrole');
  }
}

// 8. Create Admin.hdbroleconfig
function createAdminRoleConfig() {
  logSection('Step 8: Creating db/src/roles/Admin.hdbroleconfig');
  
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

// 9. Update all .hdbtabledata files
function updateHdbTableDataFiles() {
  logSection('Step 9: Updating .hdbtabledata files in db/src/data/loads');
  
  const loadsDir = path.join(DB_DIR, 'src', 'data', 'loads');
  
  if (!fs.existsSync(loadsDir)) {
    logWarning(`Directory not found: ${path.relative(ROOT_DIR, loadsDir)}`);
    return;
  }
  
  const tableDataFiles = findFilesRecursive(loadsDir, '.hdbtabledata');
  
  if (tableDataFiles.length === 0) {
    logWarning('No .hdbtabledata files found');
    return;
  }
  
  logInfo(`Found ${tableDataFiles.length} .hdbtabledata file(s)`);
  
  const namespacePattern = /sap\.hana\.democontent\.epm\.data\.loads::/g;
  
  for (const filePath of tableDataFiles) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      if (namespacePattern.test(content)) {
        content = content.replace(namespacePattern, '');
        fs.writeFileSync(filePath, content, 'utf8');
        logSuccess(`Updated: ${path.relative(ROOT_DIR, filePath)}`);
      } else {
        logInfo(`No namespace found in: ${path.relative(ROOT_DIR, filePath)}`);
      }
    } catch (error) {
      logError(`Failed to update ${path.relative(ROOT_DIR, filePath)}: ${error.message}`);
    }
  }
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
    updateCalculationView();
    updateUserRole();
    updateAdminRole();
    createAdminRoleConfig();
    updateHdbTableDataFiles();
    
    // Final summary
    logSection('Cleanup Complete!');
    log('\n📝 Important Notes:', colors.bright + colors.yellow);
    log('1. Replace all instances of "< Schema Name >" with your actual schema name in:', colors.yellow);
    log('   - db/src/roles/Admin.hdbrole', colors.yellow);
    log('   - db/src/roles/Admin.hdbroleconfig', colors.yellow);
    log('\n2. Review the changes made to ensure they match your project requirements', colors.yellow);
    log('\n3. If your project has project-specific configurations, adjust accordingly', colors.yellow);
    log('\n4. Test your deployment after these changes\n', colors.yellow);
    
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
  updateCalculationView,
  updateUserRole,
  updateAdminRole,
  createAdminRoleConfig,
  updateHdbTableDataFiles
};
