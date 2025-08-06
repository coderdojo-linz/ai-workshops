import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { validateExercisesFile, type ExercisesFile } from '@/lib/exercise-schema';

type ExerciseResponse = {
  title: string;
  folder: string;
  system_prompt_file: string;
  data_files: string[];
  data_files_content?: { [filename: string]: string };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exerciseId } = await params;
    
    // Extract query parameter
    const url = new URL(request.url);
    const includeDataFileContent = url.searchParams.get('includeDataFileContent') === 'true';
    
    // Read exercises.json
    const exercisesPath = path.join(process.cwd(), 'prompts', 'exercises.json');
    const exercisesContent = await fs.promises.readFile(exercisesPath, 'utf8');
    const exercisesData: ExercisesFile = validateExercisesFile(JSON.parse(exercisesContent));
    
    // Find the exercise
    const exercise = exercisesData.exercises[exerciseId];
    
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    
    // Build response object
    const response: ExerciseResponse = {
      title: exercise.title,
      folder: exercise.folder,
      system_prompt_file: exercise.system_prompt_file,
      data_files: exercise.data_files
    };
    
    // If requested, read and include data files content
    if (includeDataFileContent && exercise.data_files.length > 0) {
      response.data_files_content = {};
      
      for (const dataFile of exercise.data_files) {
        try {
          const dataFilePath = path.join(process.cwd(), 'prompts', exercise.folder, dataFile);
          const dataFileContent = await fs.promises.readFile(dataFilePath, 'utf8');
          response.data_files_content[dataFile] = dataFileContent;
        } catch (dataFileError) {
          console.error(`Error reading data file ${dataFile}:`, dataFileError);
          return NextResponse.json({ error: `Data file not found: ${dataFile}` }, { status: 404 });
        }
      }
    }
    
    // Return exercise metadata
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error retrieving exercise metadata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 