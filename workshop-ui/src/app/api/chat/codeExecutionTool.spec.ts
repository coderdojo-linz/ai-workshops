import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import path from 'path';
import { loadEnvConfig } from '@next/env';
import { executePython } from './codeExecutionTool';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

describe('executePython integration tests', () => {
  const csvPath = path.join(process.cwd(), 'prompts', '01-data-cave', 'data-cave.csv');
  const detectiveCsvPath = path.join(process.cwd(), 'prompts', '02-detective-beginners', 'detective-beginners.csv');

  beforeAll(() => {
    // Verify required environment variables are set
    if (!process.env.AZURE_SESSION_POOL_ENDPOINT) {
      throw new Error('AZURE_SESSION_POOL_ENDPOINT environment variable must be set to run integration tests');
    }
    if (!process.env.STORAGE_ACCOUNT) {
      throw new Error('STORAGE_ACCOUNT environment variable must be set to run integration tests');
    }
  });

  afterAll(async () => {
    // Note: Session cleanup is handled by DynamicSession internally
    // Blob storage cleanup could be added here if needed for CI/CD
  });

  it('should execute a basic Python script and return stdout/stderr', async () => {
    const script = `
print("Hello from Python!")
print("This is stdout output")
import sys
print("This goes to stderr", file=sys.stderr)
`;

    const result = await executePython(script, []);

    expect(result.stdout).toContain('Hello from Python!');
    expect(result.stdout).toContain('This is stdout output');
    expect(result.stderr).toContain('This goes to stderr');
    expect(result.resultFiles).toEqual([]);
  }, 45000); // 45 second timeout for API calls and blob operations

  it('should execute Python script that generates a file and upload to blob storage', async () => {
    const script = `
import json
import matplotlib.pyplot as plt
import numpy as np

# Create a simple plot
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2)
plt.title('Simple Sine Wave')
plt.xlabel('X values')
plt.ylabel('Y values')
plt.grid(True)
plt.savefig('/mnt/data/sine_wave.png', dpi=150, bbox_inches='tight')

# Also create a JSON file
data = {
    "message": "Test data file",
    "points": len(x),
    "max_value": float(np.max(y)),
    "min_value": float(np.min(y))
}

with open('/mnt/data/test_data.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Generated plot with {len(x)} points")
print(f"Max value: {np.max(y):.3f}")
print(f"Min value: {np.min(y):.3f}")
`;

    const result = await executePython(script, []);

    expect(result.stdout).toContain('Generated plot with 100 points');
    expect(result.stdout).toMatch(/Max value: 1\.000/);
    expect(result.stdout).toMatch(/Min value: -0\.99\d/);
    expect(result.stderr).toBe('');
    
    // Check that files were generated and uploaded
    expect(result.resultFiles).toHaveLength(2);
    
    const pngFile = result.resultFiles.find(f => f.fileName === 'sine_wave');
    const jsonFile = result.resultFiles.find(f => f.fileName === 'test_data');
    
    expect(pngFile).toBeDefined();
    expect(pngFile?.url).toMatch(/https:\/\/.*\.blob\.core\.windows\.net\/ai-workshop\/sine_wave-.*\.png/);
    expect(pngFile?.targetFileName).toMatch(/sine_wave-.*\.png/);
    
    expect(jsonFile).toBeDefined();
    expect(jsonFile?.url).toMatch(/https:\/\/.*\.blob\.core\.windows\.net\/ai-workshop\/test_data-.*\.json/);
    expect(jsonFile?.targetFileName).toMatch(/test_data-.*\.json/);
    
    // Verify that the generated URLs are accessible (HTTP 200)
    const pngResponse = await fetch(pngFile!.url);
    expect(pngResponse.status).toBe(200);
    expect(pngResponse.headers.get('content-type')).toBeTruthy(); // Should have some content type
    
    const jsonResponse = await fetch(jsonFile!.url);
    expect(jsonResponse.status).toBe(200);
    expect(jsonResponse.headers.get('content-type')).toBeTruthy(); // Should have some content type
  }, 60000); // Longer timeout for matplotlib and blob operations

  it('should execute Python script with input files', async () => {
    const script = `
import pandas as pd

# Read the CSV file
df = pd.read_csv('/mnt/data/data-cave.csv')

# Print basic info
print(f"CSV file loaded with {len(df)} rows")
print(f"Columns: {list(df.columns)}")

# Create a summary file
summary = {
    'total_rows': len(df),
    'columns': list(df.columns),
    'dtypes': df.dtypes.astype(str).to_dict()
}

# Save summary as JSON
import json
with open('/mnt/data/csv_summary.json', 'w') as f:
    json.dump(summary, f, indent=2)

print("Summary saved to csv_summary.json")
`;

    const result = await executePython(script, [csvPath]);

    expect(result.stdout).toMatch(/CSV file loaded with \d+ rows/);
    expect(result.stdout).toContain('Columns:');
    expect(result.stdout).toContain('Summary saved to csv_summary.json');
    expect(result.stderr).toBe('');
    
    // Check that the summary file was generated
    expect(result.resultFiles).toHaveLength(1);
    const summaryFile = result.resultFiles[0];
    expect(summaryFile.fileName).toBe('csv_summary');
    expect(summaryFile.url).toMatch(/https:\/\/.*\.blob\.core\.windows\.net\/ai-workshop\/csv_summary-.*\.json/);
  }, 60000);

  it('should handle Python script execution errors gracefully', async () => {
    const script = `
print("Before error")
# This will cause a NameError
undefined_variable_that_will_cause_error
print("After error - this won't be reached")
`;

    const result = await executePython(script, []);

    expect(result.stdout).toContain('Before error');
    expect(result.stderr).toContain('NameError');
    expect(result.stderr).toContain('undefined_variable_that_will_cause_error');
    expect(result.resultFiles).toEqual([]);
  }, 45000);

  it('should filter out input files from result files', async () => {
    const script = `
import pandas as pd

# Read the input CSV
df = pd.read_csv('/mnt/data/data-cave.csv')
print(f"Loaded CSV with {len(df)} rows")

# Create two new files
with open('/mnt/data/output1.txt', 'w') as f:
    f.write("This is output file 1")

with open('/mnt/data/output2.txt', 'w') as f:
    f.write("This is output file 2")

print("Created two output files")
`;

    const result = await executePython(script, [csvPath]);

    expect(result.stdout).toMatch(/Loaded CSV with \d+ rows/);
    expect(result.stdout).toContain('Created two output files');
    
    // Should only return the two new files, not the input CSV
    expect(result.resultFiles).toHaveLength(2);
    
    const outputFiles = result.resultFiles.map(f => f.fileName).sort();
    expect(outputFiles).toEqual(['output1', 'output2']);
    
    // Verify no input file is in results
    const inputFileName = path.basename(csvPath, '.csv');
    expect(result.resultFiles.find(f => f.fileName === inputFileName)).toBeUndefined();
  }, 60000);

  it('should handle scripts with no file output', async () => {
    const script = `
import math

# Just do some calculations
result = math.sqrt(16) + math.pi
print(f"Calculation result: {result:.3f}")

# Print some system info
import sys
print(f"Python version: {sys.version_info.major}.{sys.version_info.minor}")
`;

    const result = await executePython(script, []);

    expect(result.stdout).toMatch(/Calculation result: \d+\.\d+/);
    expect(result.stdout).toMatch(/Python version: \d+\.\d+/);
    expect(result.stderr).toBe('');
    expect(result.resultFiles).toEqual([]);
  }, 45000);

  it('should use different session instances when instanceId is provided', async () => {
    const sessionId1 = `test-session-${Date.now()}-1`;
    const sessionId2 = `test-session-${Date.now()}-2`;
    
    const script1 = `
# Create a file to verify session isolation
with open('/mnt/data/session_test.txt', 'w') as f:
    f.write("session_1_data")
print("Created file in session 1")
`;

    const script2 = `
# Try to read the file from session 1 (should not exist in session 2)
import os
if os.path.exists('/mnt/data/session_test.txt'):
    with open('/mnt/data/session_test.txt', 'r') as f:
        content = f.read()
    print(f"File found with content: {content}")
else:
    print("File not found - this is a different session")
    with open('/mnt/data/session_test_2.txt', 'w') as f:
        f.write("session_2_data")
    print("Created file in session 2")
`;

    // Execute in different sessions
    const result1 = await executePython(script1, [], sessionId1);
    const result2 = await executePython(script2, [], sessionId2);

    expect(result1.stdout).toContain('Created file in session 1');
    expect(result2.stdout).toContain('File not found - this is a different session');
    expect(result2.stdout).toContain('Created file in session 2');
    
    // Verify file isolation
    expect(result1.resultFiles).toHaveLength(1);
    expect(result1.resultFiles[0].fileName).toBe('session_test');
    
    expect(result2.resultFiles).toHaveLength(1);
    expect(result2.resultFiles[0].fileName).toBe('session_test_2');
  }, 60000);

  it('should execute Python script with multiple input files and handle missing files', async () => {
    const script = `
import pandas as pd
import os

# Check if both files exist first
files_to_check = ['/mnt/data/data-cave.csv', '/mnt/data/detective-beginners.csv']
missing_files = []

for file_path in files_to_check:
    if not os.path.exists(file_path):
        missing_files.append(file_path)

if missing_files:
    raise FileNotFoundError(f"Missing required files: {missing_files}")
`;

    const result = await executePython(script, [csvPath, detectiveCsvPath]);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
    expect(result.resultFiles).toEqual([]);
  }, 60000);
});