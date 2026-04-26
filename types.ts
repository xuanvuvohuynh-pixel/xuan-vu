export type QuestionType = 'ex' | 'bt';

export interface Question {
  id: string;
  type: QuestionType;
  content: string; // The full LaTeX string including \begin and \end
  sourceFile: string;
  innerContent: string; // Content without the wrapper tags, useful for AI analysis
}

export interface ExamConfig {
  mcqCount: number;
  essayCount: number;
  requirements: string;
  includeHeader: boolean;
  examVariations: number;
  includeSolutions: boolean;
}

export interface ParseResult {
  mcqs: Question[];
  essays: Question[];
  totalParsed: number;
  filesProcessed: number;
}