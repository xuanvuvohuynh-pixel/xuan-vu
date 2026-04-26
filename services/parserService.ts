import { Question } from '../types';

/**
 * Robust regex to match LaTeX environments.
 * Captures \begin{tag} ... \end{tag} handling newlines.
 */
const createRegex = (tag: string) => {
  // Flag 'g' for global, 's' (dotAll) for allowing . to match newlines
  return new RegExp(`\\\\begin\\{${tag}\\}([\\s\\S]*?)\\\\end\\{${tag}\\}`, 'g');
};

export const parseLatexFiles = async (files: File[]): Promise<{ mcqs: Question[], essays: Question[] }> => {
  const mcqs: Question[] = [];
  const essays: Question[] = [];

  for (const file of files) {
    try {
      const text = await file.text();
      
      // Match MCQs (ex)
      const exRegex = createRegex('ex');
      let exMatch;
      while ((exMatch = exRegex.exec(text)) !== null) {
        mcqs.push({
          id: `ex-${file.name}-${exMatch.index}`,
          type: 'ex',
          content: exMatch[0],
          innerContent: exMatch[1],
          sourceFile: file.name
        });
      }

      // Match Essays (bt)
      const btRegex = createRegex('bt');
      let btMatch;
      while ((btMatch = btRegex.exec(text)) !== null) {
        essays.push({
          id: `bt-${file.name}-${btMatch.index}`,
          type: 'bt',
          content: btMatch[0],
          innerContent: btMatch[1],
          sourceFile: file.name
        });
      }
    } catch (error) {
      console.error(`Error parsing file ${file.name}:`, error);
    }
  }

  return { mcqs, essays };
};