// utils/patientUtils.ts

import { isValid } from 'date-fns'; // Import date-fns utility
import { Patient, Task } from '@/types/patient'; // Import Patient and Task types

/**
 * Parses patient data from a JSON string, ensuring Date objects are correctly instantiated.
 * Handles potential errors during parsing and validation.
 *
 * @param jsonData - The JSON string containing patient data (likely from localStorage).
 * @returns An array of Patient objects with correctly parsed dates, or null if parsing fails or data is invalid.
 */
export const parsePatientsWithDates = (jsonData: string): Patient[] | null => {
  try {
    const parsedData = JSON.parse(jsonData);

    // Basic validation: Ensure it's an array
    if (!Array.isArray(parsedData)) {
        console.warn('Parsed patient data is not an array.');
        return null;
    }

    // Map over the raw patient data, converting date strings to Date objects
    return parsedData.map((patient: any): Patient => { // Add return type annotation for clarity
      // Parse patient arrival time, default to now if invalid/missing
      const arrivalTime = patient.arrivalTime ? new Date(patient.arrivalTime) : new Date();

      // Parse tasks array, ensuring nested dates are also converted
      const tasks = Array.isArray(patient.tasks)
        ? patient.tasks.map((t: any): Task => { // Add return type annotation for clarity
            const createdAt = t.createdAt ? new Date(t.createdAt) : new Date();
            const completedAt = t.completedAt ? new Date(t.completedAt) : null;
            const timerEnd = t.timerEnd ? new Date(t.timerEnd) : null;

            // Validate parsed dates within tasks, provide defaults if invalid
            const validCreatedAt = isValid(createdAt) ? createdAt : new Date();
            const validCompletedAt = completedAt && isValid(completedAt) ? completedAt : null;
            const validTimerEnd = timerEnd && isValid(timerEnd) ? timerEnd : null;

            return {
              ...t, // Spread other potential task properties
              id: t.id, // Ensure id is explicitly included
              text: t.text || 'Untitled Task', // Provide default text
              createdAt: validCreatedAt,
              completedAt: validCompletedAt,
              timerEnd: validTimerEnd,
              completionStatus: t.completionStatus || 'incomplete', // Default status
              notes: t.notes || '', // Default notes
              isAcknowledged: t.isAcknowledged || false, // Default acknowledged state
              // Recalculate isTimerExpired based on potentially validated timerEnd
              isTimerExpired: !!(validTimerEnd && validTimerEnd <= new Date()),
            };
          })
        : []; // Default to empty array if tasks are missing or not an array

      // Construct the final Patient object
      return {
        ...patient, // Spread other potential patient properties
        id: patient.id, // Ensure id is explicitly included
        name: patient.name || 'Unknown Patient', // Provide default name
        // Use validated arrival time, default to now if invalid
        arrivalTime: isValid(arrivalTime) ? arrivalTime : new Date(),
        tasks, // Use the processed tasks array
        notes: patient.notes || '', // Default notes
      };
    });
  } catch (error) {
    console.error('Error parsing patient data from JSON:', error);
    return null; // Return null on JSON parsing error
  }
};

// You can add other patient/task related utility functions here in the future.