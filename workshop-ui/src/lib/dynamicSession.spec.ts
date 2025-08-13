import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import path from 'path';
import { DynamicSession } from './dynamicSession';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

describe('DynamicSession.executeScript', () => {
  let session: DynamicSession;
  const csvPath = path.join(process.cwd(), 'prompts', '01-data.cave', 'data-cave.csv');

  beforeAll(() => {
    // Create a new session for all tests
    session = new DynamicSession();

    // Verify environment variables are set
    if (!process.env.AZURE_SESSION_POOL_ENDPOINT) {
      throw new Error('AZURE_SESSION_POOL_ENDPOINT environment variable must be set to run integration tests');
    }
  });

  afterAll(async () => {
    // Note: In a real scenario, you might want to clean up the session
    // For now, we'll let the session expire naturally
  });

  it('should execute a python script that prints to stdout', async () => {
    const script = `
print("Hello from Python!")
print("This is stdout output")
print("Testing DynamicSession")
`;

    const result = await session.executeScript(script, []);

    expect(result.status).toBe('Succeeded');
    expect(result.result.stdout).toContain('Hello from Python!');
    expect(result.result.stdout).toContain('This is stdout output');
    expect(result.result.stdout).toContain('Testing DynamicSession');
    expect(result.result.stderr).toBe('');
    expect(result.result.executionTimeInMilliseconds).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for API calls

  it('should execute a python script that prints to stderr', async () => {
    const script = `
import sys
print("This goes to stderr", file=sys.stderr)
print("Error message for testing", file=sys.stderr)
`;

    const result = await session.executeScript(script, []);

    expect(result.status).toBe('Succeeded');
    expect(result.result.stderr).toContain('This goes to stderr');
    expect(result.result.stderr).toContain('Error message for testing');
    expect(result.result.executionTimeInMilliseconds).toBeGreaterThan(0);
  }, 30000);

  it('should execute a python script that reads a file and counts lines', async () => {
    const script = `
# Read the exercises.json file
with open('/mnt/data/data-cave.csv', 'r') as file:
    content = file.read()
    
# Count lines in the original file
lines = content.split('\\n')
line_count = len(lines)

print(f"File has {line_count} lines")
`;

    const result = await session.executeScript(script, [csvPath]);

    expect(result.status).toBe('Succeeded');
    expect(result.result.stdout).toMatch(/File has \d+ lines/);
    expect(result.result.stderr).toBe('');
    expect(result.result.executionTimeInMilliseconds).toBeGreaterThan(0);
  }, 30000);

  it('should execute a python script that generates a matplotlib plot', async () => {
    const script = `
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Create test data directly in the code
data = {
    'x': [1.2, 2.5, 3.8, 1.9, 4.1, 2.7, 3.3, 1.5, 4.8, 2.1, 3.9, 1.7, 4.2, 2.8, 3.1],
    'y': [2.1, 3.4, 1.8, 4.2, 2.9, 1.6, 3.7, 2.8, 1.3, 4.0, 2.5, 3.2, 1.9, 4.1, 2.6],
    'figur': ['circle', 'square', 'triangle', 'circle', 'square', 'triangle', 'circle', 
              'square', 'triangle', 'circle', 'square', 'triangle', 'circle', 'square', 'triangle']
}

# Create DataFrame from the test data
df = pd.DataFrame(data)

# Print basic info about the data
print(f"Number of lines in the dataset: {len(df)}")
print(f"Columns: {list(df.columns)}")

# Create a scatter plot
plt.figure(figsize=(12, 8))

# Get unique categories and assign colors
categories = df['figur'].unique()
colors = ['red', 'blue', 'green', 'orange', 'purple'][:len(categories)]

# Plot each category with a different color
for i, category in enumerate(categories):
    category_data = df[df['figur'] == category]
    plt.scatter(category_data['x'], category_data['y'], 
               label=category, color=colors[i], alpha=0.7, s=50)

# Customize the plot
plt.xlabel('X Coordinate', fontsize=12)
plt.ylabel('Y Coordinate', fontsize=12)
plt.title('Scatter Plot of Data Cave Categories', fontsize=14)
plt.legend()
plt.grid(True, alpha=0.3)

plt.show()
`;

    const result = await session.executeScript(script, []);

    expect(result.status).toBe('Succeeded');

    // Check that we have execution result with the plot
    expect(result.result.executionResult).toBeDefined();
    if (result.result.executionResult) {
      expect(result.result.executionResult.type).toBe('image');
      expect(result.result.executionResult.format).toBe('png');
      expect(result.result.executionResult.base64_data).toBeDefined();
      expect(result.result.executionResult.base64_data.length).toBeGreaterThan(1000); // Should be a substantial base64 string

      // Verify it's valid base64
      expect(() => {
        Buffer.from(result.result.executionResult!.base64_data, 'base64');
      }).not.toThrow();
    }
  }, 45000); // Longer timeout for matplotlib operations

  it('should handle script execution errors gracefully', async () => {
    const script = `
# This script will intentionally cause an error
print("Before error")
undefined_variable_that_will_cause_error
print("After error - this won't be reached")
`;

    const result = await session.executeScript(script, []);

    expect(result.status).toBe('Failed');
    expect(result.result.stdout).toContain('Before error');
    expect(result.result.stderr).toContain('NameError');
    expect(result.result.stderr).toContain('undefined_variable_that_will_cause_error');
    expect(result.result.executionTimeInMilliseconds).toBeGreaterThan(0);
  }, 30000);
});
