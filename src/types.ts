/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestionType = 'choice' | 'judgement' | 'programming';

export interface Question {
  id: string; // e.g., 'choice_1', 'judgement_1', 'programming_1'
  type: QuestionType;
  number: number;
  questionText: string;
  codeBlock?: string;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D' | 'Y' | 'N' | 'program'
  explanation: string;
  score: number;
  knowledgePoints: string[];
}

export type ExamStatus = 'idle' | 'testing' | 'review';

export interface ExamAttempt {
  id: string;
  timestamp: string;
  answers: Record<string, string>;
  manualScores: Record<string, number>;
  totalScore: number;
  timeTaken: number; // in seconds
}

export const KNOWLEDGE_POINTS = [
  '初等数论',
  '(C++) 数组模拟高精度加法、减法、乘法、除法',
  '单链表、双链表、循环链表',
  '辗转相除法 (也称欧几里得算法)',
  '素数表的埃氏筛法和线性筛法',
  '唯一分解定理',
  '二分查找/二分答案 (也称二分枚举法)',
  '贪心算法',
  '分治算法 (归并排序和快速排序)',
  '递归',
  '算法复杂度的估算 (含多项式、指数、对数复杂度)'
] as const;

export type KnowledgePointType = typeof KNOWLEDGE_POINTS[number];
