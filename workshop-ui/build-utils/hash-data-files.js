#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Calculate MD5 hash of a file
 * @param {string} filePath - Path to the file
 * @returns {string} - MD5 hash as hex string
 */
function calculateMD5Hash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * Rename file with hash appended
 * @param {string} filePath - Original file path
 * @param {string} hash - MD5 hash
 * @returns {string} - New file path
 */
function renameFileWithHash(filePath, hash) {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const newFileName = `${baseName}_${hash}${ext}`;
    const newFilePath = path.join(dir, newFileName);
    
    fs.renameSync(filePath, newFilePath);
    console.log(`Renamed: ${path.basename(filePath)} -> ${newFileName}`);
    
    return newFileName;
}

/**
 * Main function to process data files
 * @param {string} promptsPath - Path to the prompts folder
 */
function hashDataFiles(promptsPath) {
    const exercisesJsonPath = path.join(promptsPath, 'exercises.json');
    
    // Check if exercises.json exists
    if (!fs.existsSync(exercisesJsonPath)) {
        console.error(`Error: exercises.json not found at ${exercisesJsonPath}`);
        process.exit(1);
    }
    
    // Read exercises.json
    const exercisesData = JSON.parse(fs.readFileSync(exercisesJsonPath, 'utf8'));
    
    // Process each exercise
    for (const [exerciseKey, exercise] of Object.entries(exercisesData.exercises)) {
        const exerciseFolder = path.join(promptsPath, exercise.folder);
        
        // Process each data file
        const newDataFiles = [];
        // Handle both string and array formats for data_files
        const dataFiles = Array.isArray(exercise.data_files) ? exercise.data_files : [exercise.data_files];
        for (const dataFile of dataFiles) {
            const dataFilePath = path.join(exerciseFolder, dataFile);
            
            // Check if data file exists
            if (!fs.existsSync(dataFilePath)) {
                console.warn(`Warning: Data file not found: ${dataFilePath}`);
                continue;
            }
            
            // Calculate MD5 hash
            const hash = calculateMD5Hash(dataFilePath);
            console.log(`Calculated hash for ${dataFile}: ${hash}`);
            
            // Rename file with hash
            const newFileName = renameFileWithHash(dataFilePath, hash);
            newDataFiles.push(newFileName);
        }
        
        // Update exercises.json with new filenames
        // Maintain original format: string for single file, array for multiple files
        exercise.data_files = newDataFiles.length === 1 ? newDataFiles[0] : newDataFiles;
    }
    
    // Write updated exercises.json
    fs.writeFileSync(exercisesJsonPath, JSON.stringify(exercisesData, null, 2));
    console.log(`Updated ${exercisesJsonPath} with new filenames`);
}

// Main execution
const promptsPath = process.argv[2];

if (!promptsPath) {
    console.error('Usage: node hash-data-files.js <prompts-folder-path>');
    console.error('Example: node hash-data-files.js ./prompts');
    process.exit(1);
}

if (!fs.existsSync(promptsPath)) {
    console.error(`Error: Prompts folder not found: ${promptsPath}`);
    process.exit(1);
}

console.log(`Processing data files in: ${promptsPath}`);
hashDataFiles(promptsPath);
console.log('Done!'); 