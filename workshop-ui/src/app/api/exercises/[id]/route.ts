import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getExerciseByNameWithResponse } from '@/lib/exercise-file-manager';

type ExerciseResponse = {
  title: string;
  folder: string;
  system_prompt_file: string;
  welcome_message?: string;
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
    
    const exerciseResult = await getExerciseByNameWithResponse(exerciseId);
    if (!exerciseResult.success) {
      return exerciseResult.error;
    }
    
    const exercise = exerciseResult.value;
    
    // Build response object
    const response: ExerciseResponse = {
      title: exercise.title,
      folder: exercise.folder,
      system_prompt_file: exercise.system_prompt_file,
      data_files: exercise.data_files
    };
    
    // Read welcome message
    try {
      const welcomeMessagePath = path.join(process.cwd(), 'prompts', exercise.folder, exercise.welcome_message_file);
      const welcomeMessage = await fs.promises.readFile(welcomeMessagePath, 'utf8');
      response.welcome_message = welcomeMessage;
    } catch (welcomeMessageError) {
      console.error(`Error reading welcome message file ${exercise.welcome_message_file}:`, welcomeMessageError);
      // Continue without welcome message if file not found
    }
    
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