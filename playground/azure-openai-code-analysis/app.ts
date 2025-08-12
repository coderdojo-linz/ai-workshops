import { AzureOpenAI } from "openai";
import dotenv from "dotenv";
import fs from "fs";
import { executePython } from "./codeExecution";

dotenv.config();

const result = await executePython({script: `
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Read the CSV file
df = pd.read_csv('/mnt/data/data-cave.csv')

# Print basic info about the data
print(f"Number of lines in the CSV file: {len(df)}")
print(f"Columns: {list(df.columns)}")
print(f"Unique categories in 'figur': {df['figur'].unique()}")

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

# Save the plot to the specified location
plt.savefig('/mnt/data/plot.png', dpi=300, bbox_inches='tight')
print("Plot saved to /mnt/data/plot.png")

# Also show some statistics
print(f"\\nData summary:")
for category in categories:
    count = len(df[df['figur'] == category])
    print(f"  {category}: {count} points")

plt.close()  # Close the plot to free memory

`});
console.log(result);
/*
const client = new AzureOpenAI({
  endpoint: process.env.AZURE_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: "2025-04-01-preview",
  deployment: "gpt-4.1",
});

const inputStream = fs.createReadStream("data-cave.csv");
const file = await client.files.create({
  file: inputStream,
  purpose: "assistants",
});

const openaiResponse = await client.responses.create({
  model: process.env.OPENAI_MODEL || "gpt-5",
  instructions: "You are a helpful assistant for plotting ",
  input: "Please tell me which columns the CSV file has.",
  stream: true,
  store: false,
  tools: [
    {
      type: "code_interpreter",
      container: {
        type: "auto",
        file_ids: [file.id],
      },
    },
  ],
});
*/