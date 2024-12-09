#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Read a file and return its content wrapped in triple backticks
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} File content wrapped in backticks
 */
async function readFileContent(filePath) {
    try {
        console.log(`Processing ${filePath}\n`);
        const content = (await readFile(filePath, 'utf-8')).trim();
        return `\`\`\`\n${content}\n\`\`\``;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Warning: File not found: ${filePath}`);
            return `[Content for ${filePath} not found]`;
        }
        throw error;
    }
}

/**
 * Read multiple files and concatenate their contents
 * @param {string[]} filePaths - Array of file paths
 * @returns {Promise<string>} Concatenated content
 */
async function getFileContents(filePaths) {
    const contents = await Promise.all(filePaths.map(async (filePath) => {
        // Remove leading slash if present to make it relative to current directory
        const cleanedPath = filePath.replace(/^\//, '');
        // Add filename as a header before the content
        const content = await readFileContent(cleanedPath);
        return `\n### ${cleanedPath}\n${content}`;
    }));

    return contents.join('\n');
}

/**
 * Process the template file using the mappings from the JSON file
 * @param {string} templatePath - Path to template file
 * @param {string} mappingsPath - Path to JSON mappings file
 * @returns {Promise<string>} Processed content
 */
async function processTemplate(templatePath, mappingsPath) {
    // Read the template
    const templateContent = await readFile(templatePath, 'utf-8');

    // Read and parse the JSON mappings
    const mappingsContent = await readFile(mappingsPath, 'utf-8');
    const mappings = JSON.parse(mappingsContent);

    // Create a map to store all replacements
    const replacements = new Map();

    // First, load all file contents
    for (const [varName, filePaths] of Object.entries(mappings)) {
        const content = await getFileContents(filePaths);
        replacements.set(varName, content);
    }

    // Now do a single pass through the template content
    // replacing only the top-level variables
    let result = templateContent;
    let lastIndex = 0;
    let finalResult = '';

    // Process the template looking for top-level variables only
    const regex = /\{(\w+)\}/g;
    let match;

    while ((match = regex.exec(templateContent)) !== null) {
        const [fullMatch, varName] = match;
        const position = match.index;

        // Add everything since the last match
        finalResult += templateContent.slice(lastIndex, position);

        // If this is a known variable, replace it
        if (replacements.has(varName)) {
            finalResult += replacements.get(varName);
        } else {
            console.warn(`Warning: Variable '${varName}' not found in mappings file - leaving unchanged`);
            finalResult += fullMatch;
        }

        lastIndex = position + fullMatch.length;
    }

    // Add any remaining content after the last match
    finalResult += templateContent.slice(lastIndex);

    return finalResult;
}

/**
 * Main function
 */
async function main() {
    // Input files
    const templateFile = 'project-prompt-template.md';
    const mappingsFile = 'files-to-include.json';

    // Generate output filename with current date
    const currentDate = new Date();
    const outputFile = `project-prompt-${currentDate.getDate()}_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.md`;

    try {
        // Process the template
        const result = await processTemplate(templateFile, mappingsFile);

        // Write the output
        await writeFile(outputFile, result, 'utf-8');
        console.log(`Successfully created ${outputFile}`);

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

// Run the main function
main().catch(error => {
    console.error(`Unhandled error: ${error.message}`);
    process.exit(1);
});