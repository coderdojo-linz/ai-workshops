import { NextRequest, NextResponse } from 'next/server';
import { getExercisesWithResponse } from '@/lib/exercise-file-manager';
import { verifyAdmin } from '@/lib/session';

/** 
 * @route   GET /api/exercises
 * @desc    Get all exercises (for admin use in workshop management)
 * @response 200 { exercises: { [code: string]: { title: string } } } or 500 { error: string }
 * @access  Admin only
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const exerciseResult = await getExercisesWithResponse();
  if (!exerciseResult.success) {
    return exerciseResult.error;
  }

  // Only return the code and title for each exercise (what the UI needs)
  const exercises = Object.fromEntries(
    Object.entries(exerciseResult.value.exercises).map(([code, exercise]) => [
      code,
      { title: exercise.title }
    ])
  );

  return NextResponse.json({ exercises });
}

