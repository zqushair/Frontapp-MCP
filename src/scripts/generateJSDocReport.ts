#!/usr/bin/env node
/**
 * Generate JSDoc Standardization Report
 * This script generates a report of files that need JSDoc standardization
 */

import path from 'path';
import fs from 'fs';
import { generateJSDocReport, JSDocGuidelines } from '../utils/jsdocStandardizer.js';
import logger from '../utils/logger.js';

/**
 * Main function
 * Generates a JSDoc standardization report and writes it to a file
 */
async function main(): Promise<void> {
  try {
    // Get the source directory
    const sourceDir = path.resolve(process.cwd(), 'src');
    
    // Generate the report
    logger.info('Generating JSDoc standardization report...');
    const report = await generateJSDocReport(sourceDir);
    
    // Calculate the percentage of files that need standardization
    const percentage = (report.filesNeedingJSDoc.length / report.totalFiles) * 100;
    
    // Create the report content
    const reportContent = `# JSDoc Standardization Report

Generated on: ${new Date().toISOString()}

## Summary

- Total files: ${report.totalFiles}
- Files needing JSDoc standardization: ${report.filesNeedingJSDoc.length}
- Percentage: ${percentage.toFixed(2)}%

## Files Needing JSDoc Standardization

${report.filesNeedingJSDoc.map((file) => `- ${path.relative(process.cwd(), file)}`).join('\n')}

## JSDoc Guidelines

${JSDocGuidelines}
`;
    
    // Write the report to a file
    const reportPath = path.resolve(process.cwd(), 'jsdoc-report.md');
    fs.writeFileSync(reportPath, reportContent);
    
    logger.info(`JSDoc standardization report generated at ${reportPath}`);
    logger.info(`${report.filesNeedingJSDoc.length} of ${report.totalFiles} files need JSDoc standardization (${percentage.toFixed(2)}%)`);
  } catch (error) {
    logger.error('Error generating JSDoc standardization report', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  logger.error('Unhandled error in main function', { error });
  process.exit(1);
});
