/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  BookOpen,
  Filter,
  Check,
  ChevronRight,
  ChevronLeft,
  Code,
  GraduationCap,
  History,
  PenTool,
  Sliders,
  Calendar,
  AlertTriangle,
  FileText,
  Bookmark,
  Sparkles,
  HelpCircle,
  Eye,
  RefreshCw,
  LogOut,
  ChevronDown,
  Layers
} from 'lucide-react';
import { EXAM_QUESTIONS } from './questions';
import { Question, ExamStatus, ExamAttempt, KNOWLEDGE_POINTS } from './types';
import { RichTextRenderer } from './components/RichTextRenderer';

// Total exam time: 120 minutes (7200 seconds)
const INITIAL_TIME_LIMIT = 120 * 60;

export default function App() {
  // --- Core State ---
  const [examStatus, setExamStatus] = useState<ExamStatus>('idle');
  const [timeRemaining, setTimeRemaining] = useState<number>(INITIAL_TIME_LIMIT);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [manualScores, setManualScores] = useState<Record<string, number>>({
    programming_1: 0,
    programming_2: 0,
  });
  const [manualComments, setManualComments] = useState<Record<string, string>>({
    programming_1: '',
    programming_2: '',
  });

  // --- Search / Filter / Navigation State ---
  const [selectedKP, setSelectedKP] = useState<string>('全部知识点');
  const [selectedType, setSelectedType] = useState<string>('全部题型');
  const [selectedStatus, setSelectedStatus] = useState<string>('全部状态'); // '全部状态' | '答对' | '答错/待批改'

  const [activeQuestionId, setActiveQuestionId] = useState<string>('choice_1');
  const [viewMode, setViewMode] = useState<'card' | 'sheet'>('sheet'); // Choose to inspect single card vs whole scrollable list
  const [historyList, setHistoryList] = useState<ExamAttempt[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  // --- Timer References & Notification ---
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showAutoSubmitAlert, setShowAutoSubmitAlert] = useState<boolean>(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState<boolean>(false);

  // Load Past History on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gesp_c5_history');
      if (saved) {
        setHistoryList(JSON.parse(saved));
      }
      
      const savedAnswers = localStorage.getItem('gesp_c5_temp_answers');
      if (savedAnswers) {
        setUserAnswers(JSON.parse(savedAnswers));
      }

      const savedTime = localStorage.getItem('gesp_c5_temp_time');
      if (savedTime) {
        const parsedTime = parseInt(savedTime, 10);
        if (parsedTime > 0) {
          setTimeRemaining(parsedTime);
          // If app reloaded and was testing, we might want to let them resume
          const savedActive = localStorage.getItem('gesp_c5_temp_status');
          if (savedActive === 'testing') {
            setExamStatus('testing');
          }
        }
      }
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
  }, []);

  // Sync Timer with Local Storage to avoid loss on refresh
  useEffect(() => {
    if (examStatus === 'testing') {
      localStorage.setItem('gesp_c5_temp_time', timeRemaining.toString());
    }
  }, [timeRemaining, examStatus]);

  // Sync Answers with Local Storage during testing
  useEffect(() => {
    if (examStatus === 'testing') {
      localStorage.setItem('gesp_c5_temp_answers', JSON.stringify(userAnswers));
    }
  }, [userAnswers, examStatus]);

  // Handle Exam Status state transitions
  useEffect(() => {
    localStorage.setItem('gesp_c5_temp_status', examStatus);
    
    if (examStatus === 'testing') {
      // Start Countdown Timer
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [examStatus]);

  // --- Calculations ---
  // Calculates score for choices and judgments automatically
  const getAutoGradedScoreDetails = (testAnswers: Record<string, string>) => {
    let choiceCorrectCount = 0;
    let choiceTotal = 0;
    let judgementCorrectCount = 0;
    let judgementTotal = 0;

    EXAM_QUESTIONS.forEach((q) => {
      const uAns = (testAnswers[q.id] || '').trim().toUpperCase();
      const corAns = q.correctAnswer.trim().toUpperCase();

      if (q.type === 'choice') {
        choiceTotal += q.score;
        if (uAns === corAns) {
          choiceCorrectCount += q.score;
        }
      } else if (q.type === 'judgement') {
        judgementTotal += q.score;
        if (uAns === corAns) {
          judgementCorrectCount += q.score;
        }
      }
    });

    return {
      choiceCorrectScore: choiceCorrectCount,
      choiceMaxScore: choiceTotal,
      judgementCorrectScore: judgementCorrectCount,
      judgementMaxScore: judgementTotal
    };
  };

  const { choiceCorrectScore, choiceMaxScore, judgementCorrectScore, judgementMaxScore } = getAutoGradedScoreDetails(userAnswers);
  const programmingTotalScore = (manualScores['programming_1'] || 0) + (manualScores['programming_2'] || 0);
  const computedTotalScore = choiceCorrectScore + judgementCorrectScore + programmingTotalScore;

  // Question Answer Statistics for progress indicator during exam
  const totalQuestions = EXAM_QUESTIONS.length;
  const answeredQuestionsCount = EXAM_QUESTIONS.filter(q => userAnswers[q.id] && userAnswers[q.id].trim() !== '').length;

  // --- Filtering Pipeline ---
  const filteredQuestions = EXAM_QUESTIONS.filter((q) => {
    // 1. Filter by Knowledge Point
    if (selectedKP !== '全部知识点') {
      if (!q.knowledgePoints.includes(selectedKP)) return false;
    }

    // 2. Filter by Question Type
    if (selectedType !== '全部题型') {
      if (selectedType === '单选题' && q.type !== 'choice') return false;
      if (selectedType === '判断题' && q.type !== 'judgement') return false;
      if (selectedType === '编程题' && q.type !== 'programming') return false;
    }

    // 3. Filter by Result Status (only active in review/past results viewing mode)
    if (examStatus === 'review' && selectedStatus !== '全部状态') {
      const uAns = (userAnswers[q.id] || '').trim().toUpperCase();
      const corAns = q.correctAnswer.trim().toUpperCase();

      if (q.type === 'programming') {
        const score = manualScores[q.id] || 0;
        if (selectedStatus === '答对') {
          // Programming is counted as CORRECT if it got high score (e.g. >= 15 points)
          if (score < 15) return false;
        } else if (selectedStatus === '答错/待批改') {
          if (score >= 15) return false;
        }
      } else {
        const isCorrect = uAns === corAns;
        if (selectedStatus === '答对' && !isCorrect) return false;
        if (selectedStatus === '答错/待批改' && isCorrect) return false;
      }
    }

    return true;
  });

  // --- Action Handlers ---
  const handleStartExam = () => {
    // Reset state & Start
    setUserAnswers({});
    setManualScores({ programming_1: 0, programming_2: 0 });
    setManualComments({ programming_1: '', programming_2: '' });
    setTimeRemaining(INITIAL_TIME_LIMIT);
    setActiveQuestionId('choice_1');
    setExamStatus('testing');
    setSelectedAttemptId(null);
    setSelectedStatus('全部状态');
    setSelectedKP('全部知识点');
    setSelectedType('全部题型');
    localStorage.removeItem('gesp_c5_temp_answers');
    localStorage.removeItem('gesp_c5_temp_time');
  };

  const handleAutoSubmit = () => {
    setShowAutoSubmitAlert(true);
    submitExamAnswers();
  };

  const submitExamAnswers = () => {
    // Complete exam
    setExamStatus('review');
    setConfirmSubmitOpen(false);

    // Save Attempt into History
    const { choiceCorrectScore, judgementCorrectScore } = getAutoGradedScoreDetails(userAnswers);
    const initialPrgScore = 0; // Starts at 0, pending instructor/self manual grading
    const total = choiceCorrectScore + judgementCorrectScore + initialPrgScore;

    const newAttempt: ExamAttempt = {
      id: 'attempt_' + Date.now(),
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
      answers: userAnswers,
      manualScores: { programming_1: 0, programming_2: 0 },
      totalScore: total,
      timeTaken: INITIAL_TIME_LIMIT - timeRemaining,
    };

    const updatedHistory = [newAttempt, ...historyList];
    setHistoryList(updatedHistory);
    localStorage.setItem('gesp_c5_history', JSON.stringify(updatedHistory));

    // Clear temp cache
    localStorage.removeItem('gesp_c5_temp_answers');
    localStorage.removeItem('gesp_c5_temp_time');
    localStorage.removeItem('gesp_c5_temp_status');

    // Force focus on the first filtered question in sheet layout
    setViewMode('sheet');
  };

  // Allow updating programming scores interactively in review mode
  const handleUpdateProgrammingScore = (qId: string, val: number) => {
    const updatedMark = { ...manualScores, [qId]: val };
    setManualScores(updatedMark);

    // Also update this run's total inside history database if applicable
    if (historyList.length > 0) {
      const copyHistory = [...historyList];
      // If we are reviewing the newest, update its score
      if (!selectedAttemptId) {
        copyHistory[0].manualScores = updatedMark;
        const freshDetails = getAutoGradedScoreDetails(copyHistory[0].answers);
        copyHistory[0].totalScore = freshDetails.choiceCorrectScore + freshDetails.judgementCorrectScore + (updatedMark['programming_1'] || 0) + (updatedMark['programming_2'] || 0);
      } else {
        // If reviewing specific historical attempt
        const idx = copyHistory.findIndex(h => h.id === selectedAttemptId);
        if (idx !== -1) {
          copyHistory[idx].manualScores = updatedMark;
          const freshDetails = getAutoGradedScoreDetails(copyHistory[idx].answers);
          copyHistory[idx].totalScore = freshDetails.choiceCorrectScore + freshDetails.judgementCorrectScore + (updatedMark['programming_1'] || 0) + (updatedMark['programming_2'] || 0);
        }
      }
      setHistoryList(copyHistory);
      localStorage.setItem('gesp_c5_history', JSON.stringify(copyHistory));
    }
  };

  const loadPastAttempt = (attempt: ExamAttempt) => {
    setUserAnswers(attempt.answers);
    setManualScores(attempt.manualScores || { programming_1: 0, programming_2: 0 });
    setSelectedAttemptId(attempt.id);
    setExamStatus('review');
    setViewMode('sheet');
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = historyList.filter(item => item.id !== id);
    setHistoryList(updated);
    localStorage.setItem('gesp_c5_history', JSON.stringify(updated));
    if (selectedAttemptId === id) {
      setSelectedAttemptId(null);
      setExamStatus('idle');
    }
  };

  // Helper values for timer display
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainSecs = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainSecs.toString().padStart(2, '0')}`;
  };

  const getTimerStyles = () => {
    if (timeRemaining < 10 * 60) {
      return 'bg-red-50 text-red-600 border-red-200 animate-pulse';
    }
    if (timeRemaining < 30 * 60) {
      return 'bg-amber-50 text-amber-600 border-amber-200';
    }
    return 'bg-blue-50 text-blue-600 border-blue-200';
  };

  // Find active question object in list
  const activeQuestionIndex = EXAM_QUESTIONS.findIndex(q => q.id === activeQuestionId);
  const activeQuestion = EXAM_QUESTIONS[activeQuestionIndex];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-950 flex flex-col">
      
      {/* --- Top Banner & Application Header --- */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-md shadow-blue-500/20 text-white flex items-center justify-center">
              <GraduationCap className="h-6 w-6" id="logo-icon" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold leading-none tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-sm">GESP C++</span>
                <span className="text-xs font-medium text-slate-400">五级考试</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">2026年03月编程能力等级认证模拟系统</h1>
            </div>
          </div>

          {/* TIMER SECT - DISPLAY DYNAMICALLY ONLY DURING EXAM */}
          {examStatus === 'testing' && (
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-4 py-2 rounded-2xl border text-sm font-semibold font-mono shadow-xs transition-colors duration-300 ${getTimerStyles()}`}>
                <Clock className="w-4 h-4 mr-2" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
              <button
                id="submit-exam-btn"
                onClick={() => setConfirmSubmitOpen(true)}
                className="inline-flex items-center px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 mr-1.5" />
                交卷
              </button>
            </div>
          )}

          {/* RESULTS DISPLAY ACCENT */}
          {examStatus === 'review' && (
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 font-medium">考试成绩总分 / 100</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-black font-mono text-emerald-600 tracking-tight">{computedTotalScore}</span>
                  <span className="text-xs text-slate-400">分</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <button
                id="redo-test-btn"
                onClick={handleStartExam}
                className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                重新挑战
              </button>
            </div>
          )}

          {/* OFF STATE STATS */}
          {examStatus === 'idle' && (
            <button
              id="quick-start-btn"
              onClick={handleStartExam}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <Code className="w-4 h-4 mr-2" />
              立刻开始考试
            </button>
          )}

        </div>
      </header>

      {/* --- Main Structure Segment --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

        {/* ========================================================= */}
        {/* --- STATE 1: IDLE / STARTER VIEW                        --- */}
        {/* ========================================================= */}
        {examStatus === 'idle' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            
            {/* Promo Left Panel */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative">
                  <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full mb-5">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    中国计算机学会 CCF GESP 精典原卷
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                    C++ 五级 官方专业真题模拟系统
                  </h2>
                  <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-2xl mb-6">
                    本试卷来源于 <b>2026年3月 CCF 编程能力等级认证（GESP）C++ 五级证书真题</b>。
                    包含单选题 15 题（30分）、判断题 10 题（20分）以及 2 道极具挑战力的编程题（50分）。
                    计时 120 分钟并支持手动评分，帮助备考学子深度拆解知识点漏洞。
                  </p>

                  {/* Highlights Bento */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                      <Clock className="w-5 h-5 text-blue-500 mb-2" />
                      <div className="text-xs text-slate-400 font-medium">考场限时</div>
                      <div className="text-sm font-bold text-slate-800">120 分钟自动关机</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <Layers className="w-5 h-5 text-indigo-500 mb-2" />
                      <div className="text-xs text-slate-400 font-medium font-sans">知识点深度过滤</div>
                      <div className="text-sm font-bold text-slate-800">11 类算法模块</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <Sliders className="w-5 h-5 text-emerald-500 mb-2" />
                      <div className="text-xs text-slate-400 font-medium">编程自评</div>
                      <div className="text-sm font-bold text-slate-800">支持独立手动打分</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      id="start-exam-large"
                      onClick={handleStartExam}
                      className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer text-base"
                    >
                      开始正式答题
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </button>
                    
                    <button
                      id="browse-questions-first"
                      onClick={() => {
                        setExamStatus('review');
                        setUserAnswers({});
                        setManualScores({ programming_1: 0, programming_2: 0 });
                      }}
                      className="inline-flex items-center px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl border border-slate-200 transition-all cursor-pointer text-sm"
                    >
                      <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                      先看题库/知识备忘
                    </button>
                  </div>

                </div>
              </div>

              {/* Exam Instructions / Schema Breakdown */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-xs">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center">
                  <FileText className="w-5 h-5 text-blue-500 mr-2" />
                  本次考试结构说明
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="space-y-1.5">
                    <div className="text-xs font-extrabold text-blue-600">SECTION 01</div>
                    <h4 className="font-bold text-slate-800 text-sm">单项选择题 (2分 × 15)</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      考察包含链表操作、素数筛选、二分答案以及算法时间复杂度推算。
                    </p>
                    <div className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">总分 30分</div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-extrabold text-purple-600">SECTION 02</div>
                    <h4 className="font-bold text-slate-800 text-sm">判断对错题 (2分 × 10)</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      主要考察数论递推、快速排序稳定性、逆序对推导。
                    </p>
                    <div className="inline-block bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">总分 20分</div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-extrabold text-emerald-600">SECTION 03</div>
                    <h4 className="font-bold text-slate-800 text-sm">专业编程题 (25分 × 2)</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      含<b>《有限不循环小数》</b>和<b>《找数》</b>，输入并手动进行评分。
                    </p>
                    <div className="inline-block bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">总分 50分</div>
                  </div>

                </div>
              </div>

            </div>

            {/* Right Panel: Exam History & List */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
                  <span className="flex items-center">
                    <History className="w-4 h-4 text-slate-400 mr-2" />
                    历史考试记录
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">{historyList.length}次</span>
                </h3>

                {historyList.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                    <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">目前暂无做题历史</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">开始一场模拟考来体验吧！</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {historyList.map((item, idx) => {
                      return (
                        <div
                          key={item.id}
                          onClick={() => loadPastAttempt(item)}
                          className="group p-3.5 bg-slate-50 hover:bg-slate-100/80 active:bg-slate-200/50 rounded-xl border border-slate-200/50 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-700 font-mono">
                                #{historyList.length - idx}届模拟
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center">
                                <Calendar className="w-3 h-3 mr-0.5" />
                                {item.timestamp.split(' ')[0]}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              用时：{Math.floor(item.timeTaken / 60)}分 {item.timeTaken % 60}秒
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-base font-black font-mono text-emerald-600">{item.totalScore}</div>
                              <span className="text-[10px] text-slate-400 leading-none">总得分</span>
                            </div>
                            <button
                              id={`delete-history-btn-${item.id}`}
                              onClick={(e) => deleteHistoryItem(e, item.id)}
                              className="p-1 px-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="删除记录"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Syllabus / Knowledge Points */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  大纲考核知识模块回顾
                </h3>
                <div className="flex flex-wrap gap-2">
                  {KNOWLEDGE_POINTS.map((kp, idx) => {
                    return (
                      <span
                        key={idx}
                        className="text-xs bg-slate-50 border border-slate-200/60 text-slate-600 px-3 py-1 rounded-lg hover:border-blue-250 transition-colors"
                      >
                        {kp}
                      </span>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* --- STATE 2: ACTIVE TESTING ENVIRONMENT (Count 2h)         --- */}
        {/* ========================================================= */}
        {examStatus === 'testing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
            
            {/* Left Column: Side navigations & Question Grid */}
            <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
              
              {/* Exam Stats card inside test */}
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>总体答题进度</span>
                  <span className="font-mono font-bold text-slate-700">{answeredQuestionsCount} / {totalQuestions} 已做</span>
                </div>
                {/* Micro Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(answeredQuestionsCount / totalQuestions) * 100}%` }}
                  ></div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center font-medium">
                    <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    当前模式: <b>单题精练卡片</b>
                  </span>
                  <button 
                    onClick={() => setViewMode(viewMode === 'sheet' ? 'card' : 'sheet')}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center"
                  >
                    切换整卷浏览
                  </button>
                </div>
              </div>

              {/* Floating Grid Navigation */}
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">答题板定位导航</h4>
                
                {/* SECTION 1: Choices */}
                <div className="space-y-2 mb-4">
                  <div className="text-[10px] font-bold text-slate-400 flex justify-between">
                    <span>1. 单选题 (1~15)</span>
                    <span className="font-mono">每题 2 分</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {EXAM_QUESTIONS.filter(q => q.type === 'choice').map((q) => {
                      const hasAnswer = userAnswers[q.id] && userAnswers[q.id] !== '';
                      const isActive = q.id === activeQuestionId;
                      return (
                        <button
                          key={q.id}
                          id={`nav-grid-${q.id}`}
                          onClick={() => {
                            setActiveQuestionId(q.id);
                            setViewMode('card');
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer text-center ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : hasAnswer
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                              : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          {q.number}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 2: Judgement */}
                <div className="space-y-2 mb-4">
                  <div className="text-[10px] font-bold text-slate-400 flex justify-between">
                    <span>2. 判断题 (1~10)</span>
                    <span className="font-mono">每题 2 分</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {EXAM_QUESTIONS.filter(q => q.type === 'judgement').map((q) => {
                      const hasAnswer = userAnswers[q.id] && userAnswers[q.id] !== '';
                      const isActive = q.id === activeQuestionId;
                      return (
                        <button
                          key={q.id}
                          id={`nav-grid-${q.id}`}
                          onClick={() => {
                            setActiveQuestionId(q.id);
                            setViewMode('card');
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer text-center ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : hasAnswer
                              ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                              : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          J{q.number}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 3: Programming */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 flex justify-between">
                    <span>3. 编程大题 (1~2)</span>
                    <span className="font-mono font-bold text-emerald-600">每题 25 分</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {EXAM_QUESTIONS.filter(q => q.type === 'programming').map((q) => {
                      const hasAnswer = userAnswers[q.id] && userAnswers[q.id] !== '';
                      const isActive = q.id === activeQuestionId;
                      return (
                        <button
                          key={q.id}
                          id={`nav-grid-${q.id}`}
                          onClick={() => {
                            setActiveQuestionId(q.id);
                            setViewMode('card');
                          }}
                          className={`py-2 rounded-xl text-xs font-bold font-mono transition-all duration-200 cursor-pointer text-center ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : hasAnswer
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          编程题 {q.number}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Leave Safety Exit Button */}
              <button
                id="terminate-exam-btn"
                onClick={() => {
                  if (confirm("您确定要强行退出当前考试吗？退出后已填答案将不会被保存。")) {
                    setExamStatus('idle');
                    setUserAnswers({});
                    localStorage.removeItem('gesp_c5_temp_answers');
                    localStorage.removeItem('gesp_c5_temp_time');
                  }
                }}
                className="w-full py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>强行终止考试</span>
              </button>

            </div>

            {/* Right Column: Dynamic Question display either scroll or single card */}
            <div className="lg:col-span-9 space-y-6">

              {viewMode === 'card' ? (
                /* --- MODE A: SINGLE QUESTION STEPPER CARD --- */
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                  
                  {/* Top metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-extrabold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                        {activeQuestion.type === 'choice' ? '单选题' : activeQuestion.type === 'judgement' ? '判断题' : '编程大题'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        第 {activeQuestion.number} 题 / 共 {activeQuestion.type === 'choice' ? 15 : activeQuestion.type === 'judgement' ? 10 : 2} 题
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold font-mono text-slate-500">试题分值: {activeQuestion.score}分</span>
                      <span className="text-slate-200">|</span>
                      <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded font-medium">
                        知识点：{activeQuestion.knowledgePoints.join(' / ')}
                      </span>
                    </div>
                  </div>

                  {/* Question main content */}
                  <div className="space-y-6">
                    <div>
                      <div className="text-base sm:text-lg text-slate-900 leading-relaxed font-sans">
                        {activeQuestion.type !== 'programming' && (
                          <span className="font-extrabold text-slate-800 mr-1.5 mb-2 inline-block">第 {activeQuestion.number} 题</span>
                        )}
                        <RichTextRenderer text={activeQuestion.questionText} fontSizeClass="text-base sm:text-lg" />
                      </div>
                      
                      {/* Optional C++ snippet code (hide programming reference code blocks during exam) */}
                      {activeQuestion.codeBlock && (activeQuestion.type !== 'programming' || examStatus === 'review') && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                          <div className="bg-slate-900/90 text-[10px] text-slate-400 font-mono px-4 py-1.5 flex justify-between items-center select-none">
                            <span>C++ Code Block</span>
                            <span>Standard Compiler</span>
                          </div>
                          <pre className="bg-slate-950 text-slate-100 text-xs sm:text-sm p-4 overflow-x-auto font-mono leading-relaxed">
                            <code>{activeQuestion.codeBlock}</code>
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* RENDER ANSWER INPUT AREA ACCORDING TO TYPE */}
                    <div className="pt-4">

                      {/* 1. Choice Options Selector */}
                      {activeQuestion.type === 'choice' && activeQuestion.options && (
                        <div className="grid grid-cols-1 gap-3.5">
                          {Object.entries(activeQuestion.options).map(([key, value]) => {
                            const isSelected = userAnswers[activeQuestion.id] === key;
                            return (
                              <button
                                key={key}
                                id={`ans-${activeQuestion.id}-${key}`}
                                onClick={() => setUserAnswers({ ...userAnswers, [activeQuestion.id]: key })}
                                className={`text-left p-4 rounded-2xl border text-sm flex items-center shadow-xs transition-all duration-200 cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50/50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 font-medium'
                                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350'
                                }`}
                              >
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs mr-4 font-mono transition-all duration-150 ${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                }`}>
                                  {key}
                                </span>
                                <span className="flex-1 whitespace-pre-wrap leading-normal">{value}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 2. Judgement Selector */}
                      {activeQuestion.type === 'judgement' && (
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            id={`ans-${activeQuestion.id}-Y`}
                            onClick={() => setUserAnswers({ ...userAnswers, [activeQuestion.id]: 'Y' })}
                            className={`p-6 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                              userAnswers[activeQuestion.id] === 'Y'
                                ? 'bg-blue-50/50 border-blue-500 text-blue-900 ring-2 ring-blue-500/15 font-medium'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${
                              userAnswers[activeQuestion.id] === 'Y' ? 'bg-blue-600 text-white' : 'bg-green-50 text-green-600'
                            }`}>
                              √
                            </span>
                            <span className="text-sm font-bold">正确 (True)</span>
                          </button>

                          <button
                            id={`ans-${activeQuestion.id}-N`}
                            onClick={() => setUserAnswers({ ...userAnswers, [activeQuestion.id]: 'N' })}
                            className={`p-6 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                              userAnswers[activeQuestion.id] === 'N'
                                ? 'bg-purple-50/50 border-purple-500 text-purple-900 ring-2 ring-purple-500/15 font-medium'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${
                              userAnswers[activeQuestion.id] === 'N' ? 'bg-purple-600 text-white' : 'bg-red-50 text-red-600'
                            }`}>
                              ✗
                            </span>
                            <span className="text-sm font-bold">错误 (False)</span>
                          </button>
                        </div>
                      )}

                      {/* 3. Programming Code Editor Editor */}
                      {activeQuestion.type === 'programming' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center">
                              <Code className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              C++ 编辑区 (请将符合标准的源程序贴入下方)
                            </span>
                            <button
                              onClick={() => {
                                if (confirm("您确认要清空并重置代码区域为样板模板吗？")) {
                                  setUserAnswers({ ...userAnswers, [activeQuestion.id]: '' });
                                }
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              重置白纸
                            </button>
                          </div>

                          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                            <textarea
                              id={`textarea-${activeQuestion.id}`}
                              value={userAnswers[activeQuestion.id] || ''}
                              onChange={(e) => setUserAnswers({ ...userAnswers, [activeQuestion.id]: e.target.value })}
                              placeholder={`#include <iostream>\nusing namespace std;\n\nint main() {\n    // 请在此处键入您的解答代码...\n\n    return 0;\n}`}
                              className="w-full h-80 p-5 bg-slate-950 text-emerald-400 font-mono text-xs sm:text-sm leading-relaxed outline-none resize-none border-none focus:ring-0"
                            />
                          </div>

                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 text-slate-500 text-xs leading-relaxed space-y-1">
                            <h5 className="font-bold text-slate-700">答题提醒：</h5>
                            <p>1. 数据流规模较大，建议采用较为高效的检索方法（如二分检索或线性筛选）。</p>
                            <p>2. 此系统在交卷后支持<b>手动自评/老师阅卷评分</b>（满分25分），请根据标准参考程序进行对应比对打分。</p>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Stepper Footer Nav */}
                  <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (activeQuestionIndex > 0) {
                          setActiveQuestionId(EXAM_QUESTIONS[activeQuestionIndex - 1].id);
                        }
                      }}
                      disabled={activeQuestionIndex === 0}
                      className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl disabled:opacity-40 disabled:hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      上一题
                    </button>

                    <span className="text-xs text-slate-400">
                      第 {activeQuestionIndex + 1} / {totalQuestions} 个项目
                    </span>

                    {activeQuestionIndex < totalQuestions - 1 ? (
                      <button
                        onClick={() => {
                          setActiveQuestionId(EXAM_QUESTIONS[activeQuestionIndex + 1].id);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        下一题
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmSubmitOpen(true)}
                        className="inline-flex items-center px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer"
                      >
                        交卷并查看分析
                      </button>
                    )}
                  </div>

                </div>
              ) : (
                /* --- MODE B: COMPLETE ALL QUESTIONS SHEET SCROLL VIEW --- */
                <div className="space-y-6">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs text-slate-400 font-bold flex items-center">
                      <FileText className="w-4 h-4 mr-1 md:text-blue-500" />
                      当前正在以“整卷试卷模式”浏览所有题目
                    </span>
                    <button 
                      onClick={() => setViewMode('card')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      切换单题精读卡片模式
                    </button>
                  </div>

                  {EXAM_QUESTIONS.map((q) => {
                    const value = userAnswers[q.id] || '';
                    return (
                      <div
                        key={q.id}
                        onClick={() => setActiveQuestionId(q.id)}
                        className={`bg-white rounded-3xl border p-6 sm:p-8 transition-all scroll-mt-24 ${
                          q.id === activeQuestionId ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-slate-200/80'
                        }`}
                      >
                        {/* Title metadata strip */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-400">第 {q.number} 题</span>
                            <span className="text-xs bg-slate-100 font-medium text-slate-500 px-2 py-0.5 rounded-sm">
                              {q.type === 'choice' ? '单选题' : q.type === 'judgement' ? '判断题' : '编程大题'}
                            </span>
                            <span className="text-[10px] text-slate-400">| {q.score} 分</span>
                          </div>
                          <span className="text-[10px] bg-slate-50 text-slate-500 px-2.5 py-0.5 rounded-full">
                            分类：{q.knowledgePoints.join(' / ')}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="text-sm sm:text-base mb-4 font-sans leading-relaxed">
                          <RichTextRenderer text={q.questionText} fontSizeClass="text-sm sm:text-base font-bold text-slate-800" />
                        </div>

                        {q.codeBlock && (q.type !== 'programming' || examStatus === 'review') && (
                          <div className="mb-4 rounded-xl overflow-hidden border border-slate-200">
                            <pre className="bg-slate-950 text-slate-100 text-xs p-4 overflow-x-auto font-mono">
                              <code>{q.codeBlock}</code>
                            </pre>
                          </div>
                        )}

                        {/* Answers components */}
                        {q.type === 'choice' && q.options && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(q.options).map(([key, valueOpt]) => {
                              const isSelected = value === key;
                              return (
                                <button
                                  key={key}
                                  onClick={() => setUserAnswers({ ...userAnswers, [q.id]: key })}
                                  className={`text-left p-3.5 rounded-xl border text-xs flex items-center transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-50/50 border-blue-500 text-blue-900 ring-1 ring-blue-500/10 font-medium'
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] mr-3 font-mono ${
                                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {key}
                                  </span>
                                  <span className="flex-1 whitespace-pre-wrap">{valueOpt}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'judgement' && (
                          <div className="flex gap-4 max-w-sm">
                            <button
                              onClick={() => setUserAnswers({ ...userAnswers, [q.id]: 'Y' })}
                              className={`flex-1 py-3 px-4 rounded-xl border text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                                value === 'Y'
                                  ? 'bg-blue-50/50 border-blue-500 text-blue-900 font-bold'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <span>√ 正确</span>
                            </button>
                            <button
                              onClick={() => setUserAnswers({ ...userAnswers, [q.id]: 'N' })}
                              className={`flex-1 py-3 px-4 rounded-xl border text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                                value === 'N'
                                  ? 'bg-purple-50/50 border-purple-500 text-purple-900 font-bold'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <span>✗ 错误</span>
                            </button>
                          </div>
                        )}

                        {q.type === 'programming' && (
                          <div className="space-y-2">
                            <textarea
                              value={value}
                              onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })}
                              placeholder={`// 请在此键入您的答题程序...\n#include <iostream>\nusing namespace std;\n\nint main() {\n\n    return 0;\n}`}
                              className="w-full h-48 p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400 select-text"
                            />
                          </div>
                        )}

                      </div>
                    );
                  })}

                  {/* Complete Action footer */}
                  <div className="p-8 bg-white rounded-3xl border border-slate-200/85 text-center space-y-4">
                    <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                    <div>
                      <h4 className="text-base font-bold text-slate-800">所有题目已经浏览检查完毕？</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        一经交卷，选择及判断题将全自动由系统对比打分，双编程大题转为自评/手动判分。
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmSubmitOpen(true)}
                      className="inline-flex items-center px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/10 cursor-pointer"
                    >
                      安全检查无误，立即提交
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* --- STATE 3: REVIEW / PAST COMPLETED MODE                  --- */}
        {/* ========================================================= */}
        {examStatus === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Sidebar: Filtering Matrix */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 gap-6 space-y-6">
              
              {/* Grading Summary scorecard statistics */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center">
                  <Award className="w-5 h-5 text-emerald-500 mr-2" />
                  本次考试智能打分结果
                </h3>

                <div className="space-y-4">
                  
                  {/* Total score readout */}
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500">累计总评分 / 满分 100</span>
                    <div className="text-right">
                      <span className="text-3xl font-black font-mono text-emerald-600 leading-none">{computedTotalScore}</span>
                      <span className="text-xs text-slate-400 ml-1">分</span>
                    </div>
                  </div>

                  {/* Section division review status */}
                  <div className="space-y-2.5 text-xs">
                    
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span>
                        单项选择题 (自动判定)
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {choiceCorrectScore} / {choiceMaxScore} 分
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2"></span>
                        对错判断题 (自动判定)
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {judgementCorrectScore} / {judgementMaxScore} 分
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-t border-slate-100/80 pt-2.5">
                      <span className="text-slate-600 flex items-center font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
                        编程考核题 (用户手动批阅)
                      </span>
                      <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {programmingTotalScore} / 50 分
                      </span>
                    </div>

                  </div>

                  <div className="pt-2 bg-slate-50/50 p-3 rounded-xl text-[10px] text-slate-400 leading-relaxed border border-slate-100">
                    <span className="font-bold text-slate-600">批改指南：</span>
                    您提交后，该模拟考试系统已根据参考程序对编程题给出详细思路。请点击对应编程试题查阅标准解答，并在手动打分卡片处录入分数及点评（左右滑动滑杆即可），累计分值会自动录入总表。
                  </div>

                </div>
              </div>

              {/* Advanced Interactive Filtering Toolbox */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                
                <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider flex items-center pb-1 border-b border-slate-100">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  错题与知识点筛选矩阵
                </h3>

                {/* Filter 1: Knowledge Point Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">按知识要点分类过滤：</label>
                  <div className="relative">
                    <select
                      value={selectedKP}
                      onChange={(e) => setSelectedKP(e.target.value)}
                      className="w-full p-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="全部知识点">✨ 全部考察知识点</option>
                      {KNOWLEDGE_POINTS.map((kp, idx) => (
                        <option key={idx} value={kp}>{kp}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-450 text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Filter 2: Question Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">按考察题型过滤：</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['全部题型', '单选题', '判断题', '编程题'].map((type) => {
                      const isActive = selectedType === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          className={`py-2 px-3 border rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter 3: Result Correctness */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">按正确状态过滤：</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['全部状态', '答对', '答错/待批改'].map((status) => {
                      const isActive = selectedStatus === status;
                      return (
                        <button
                          key={status}
                          onClick={() => setSelectedStatus(status)}
                          className={`py-2 text-[10px] sm:text-xs font-semibold border rounded-lg cursor-pointer transition-all ${
                            isActive
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick metrics */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>筛选过滤出：{filteredQuestions.length} 道符合题</span>
                  <button
                    onClick={() => {
                      setSelectedKP('全部知识点');
                      setSelectedType('全部题型');
                      setSelectedStatus('全部状态');
                    }}
                    className="text-blue-500 hover:underline cursor-pointer"
                  >
                    重置所有筛选
                  </button>
                </div>

              </div>

              {/* Exam Redo actions */}
              <div className="bg-slate-100 rounded-3xl p-5 border border-slate-300/40 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold text-slate-700">想要重新挑战本试卷吗？</h5>
                  <p className="text-[10px] text-slate-400">重新开始将会清空答题区！</p>
                </div>
                <button
                  onClick={handleStartExam}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer hover:shadow-md active:scale-95 transition-all text-center shrink-0"
                >
                  重考一次
                </button>
              </div>

            </div>

            {/* Right Main Column: Solutions & Evaluation Worksheet Sheet */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-blue-500" />
                  考后试题解析与手动自评答卷
                </h4>
                {selectedAttemptId && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200/50 font-medium">
                    🔍 正在调阅历史考卷：{selectedAttemptId.split('_').slice(1)}
                  </span>
                )}
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
                  <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-slate-800 font-bold mb-1">未过滤到任何考题</h4>
                  <p className="text-xs text-slate-400">请尝试切换或松绑上述的左侧过滤分类条件。</p>
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const uAns = (userAnswers[q.id] || '').trim().toUpperCase();
                  const corAns = q.correctAnswer.trim().toUpperCase();
                  const isChoiceOrJudgement = q.type !== 'programming';
                  
                  // Score verification
                  const isCorrectAnswer = uAns === corAns;

                  return (
                    <div
                      key={q.id}
                      id={`review-card-${q.id}`}
                      className={`bg-white rounded-3xl border p-6 sm:p-8 shadow-xs relative overflow-hidden transition-all ${
                        q.id === activeQuestionId ? 'ring-2 ring-blue-500/15 border-blue-400' : 'border-slate-200/80'
                      }`}
                    >
                      {/* Left vertical color bar indicating status */}
                      <div className={`absolute top-0 bottom-0 left-0 w-2.5 ${
                        q.type === 'programming'
                          ? 'bg-amber-400'
                          : isCorrectAnswer
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}></div>

                      {/* Header row tagstrip metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4.5 pl-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-extrabold text-slate-400">第 {q.number} 题</span>
                          <span className="text-xs bg-slate-100 font-bold text-slate-500 px-2.5 py-0.5 rounded-sm">
                            {q.type === 'choice' ? '单选题' : q.type === 'judgement' ? '判断题' : '编程解答题'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">| {q.score} 分</span>
                        </div>

                        {/* STATUS BADGE COVERS CHOICE & JUDGEMENT ONLY */}
                        {isChoiceOrJudgement ? (
                          isCorrectAnswer ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              答对
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-150">
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              答错
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/50">
                            <PenTool className="w-3.5 h-3.5 mr-1" />
                            自评得分：{(manualScores[q.id] || 0)}分
                          </span>
                        )}
                      </div>

                      {/* Question Text styling */}
                      <div className="pl-2 space-y-4">
                        <div className="text-sm sm:text-base mb-4 font-sans leading-relaxed">
                          <RichTextRenderer text={q.questionText} fontSizeClass="text-sm sm:text-base font-bold text-slate-800" />
                        </div>

                        {q.codeBlock && (
                          <div className="rounded-xl overflow-hidden border border-slate-200">
                            <pre className="bg-slate-950 text-slate-100 text-xs p-4 overflow-x-auto font-mono">
                              <code>{q.codeBlock}</code>
                            </pre>
                          </div>
                        )}

                        {/* CHOICE OPTIONS READ-ONLY */}
                        {q.type === 'choice' && q.options && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                            {Object.entries(q.options).map(([key, optText]) => {
                              const isSelectedByUser = uAns === key;
                              const isCorrectKey = corAns === key;

                              let optionStyles = 'border-slate-200 bg-white text-slate-700';
                              let badgeStyles = 'bg-slate-100 text-slate-500';

                              if (isSelectedByUser) {
                                optionStyles = 'border-rose-400 bg-rose-50/20 text-rose-950';
                                badgeStyles = 'bg-rose-500 text-white';
                              }
                              if (isCorrectKey) {
                                optionStyles = 'border-emerald-400 bg-emerald-50/30 text-emerald-950 font-medium';
                                badgeStyles = 'bg-emerald-600 text-white';
                              }

                              return (
                                <div
                                  key={key}
                                  className={`p-3 rounded-xl border text-xs flex items-center transition-all ${optionStyles}`}
                                >
                                  <span className={`w-6 h-6 rounded flex items-center justify-center font-black text-[10px] mr-3 font-mono shrink-0 select-none ${badgeStyles}`}>
                                    {key}
                                  </span>
                                  <span className="flex-1 whitespace-pre-wrap">{optText}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* CONDITIONAL COMPILATION STATUS / SCORE DATA CHIPS */}
                        <div className="pt-3.5 flex flex-wrap items-center gap-4 text-xs font-mono">
                          
                          {isChoiceOrJudgement && (
                            <>
                              <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-slate-600">
                                您的答题：
                                <span className={`font-black ml-1.5 ${isCorrectAnswer ? 'text-emerald-700' : 'text-red-700'}`}>
                                  {uAns === '' ? '（未答题）' : q.type === 'judgement' ? (uAns === 'Y' ? '正确 (√)' : '错误 (✗)') : uAns}
                                </span>
                              </div>

                              <div className="bg-emerald-50/50 border border-emerald-100 px-3.5 py-1.5 rounded-xl text-emerald-800">
                                标准答案：
                                <span className="font-extrabold ml-1.5">
                                  {q.type === 'judgement' ? (corAns === 'Y' ? '正确 (√)' : '错误 (✗)') : corAns}
                                </span>
                              </div>
                            </>
                          )}

                        </div>

                        {/* --- EXCITING PART: PROGRAMMING EVALUATION CONSOLE SIDE-BY-SIDE --- */}
                        {q.type === 'programming' && (
                          <div className="space-y-6 pt-2">
                            
                            {/* Comparison Side-by-Side Panel grids */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                              
                              {/* Left: Candidate's Submitted C++ script */}
                              <div className="flex flex-col space-y-1.5">
                                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 pl-1 flex items-center">
                                  <Code className="w-3.5 h-3.5 text-slate-450 mr-1" />
                                  您的答卷源程序：
                                </span>
                                <div className="rounded-xl overflow-hidden border border-slate-200 h-64 shadow-xs relative flex flex-col">
                                  {uAns === '' ? (
                                    <div className="flex-1 bg-slate-900 border border-slate-200 flex flex-col items-center justify-center p-6 text-center select-none text-slate-500">
                                      <Bookmark className="w-8 h-8 text-slate-600 mb-2" />
                                      <p className="text-xs">（未录入任何解答代码）</p>
                                    </div>
                                  ) : (
                                    <pre className="flex-1 bg-slate-950 text-emerald-400 text-xs p-4 overflow-auto font-mono select-text whitespace-pre leading-relaxed select-text">
                                      <code>{uAns}</code>
                                    </pre>
                                  )}
                                </div>
                              </div>

                              {/* Right: reference template answer code */}
                              <div className="flex flex-col space-y-1.5">
                                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 pl-1 flex items-center">
                                  <GraduationCap className="w-3.5 h-3.5 text-blue-500 mr-1" />
                                  官方满分参考程序：
                                </span>
                                <div className="rounded-xl overflow-hidden border border-slate-200 h-64 shadow-xs flex flex-col">
                                  <pre className="flex-1 bg-slate-950 text-slate-100 text-xs p-4 overflow-auto font-mono select-text whitespace-pre leading-relaxed">
                                    <code>{q.codeBlock}</code>
                                  </pre>
                                </div>
                              </div>

                            </div>

                            {/* Self markings/manual grading console widget */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 shadow-xs flex flex-col sm:flex-row items-center gap-6">
                              
                              <div className="flex-1 space-y-2 w-full">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-xs font-black text-slate-700 flex items-center">
                                    <Sliders className="w-4 h-4 mr-1 text-slate-500" />
                                    编程打分控制板 (得分范围：0 - 25分)
                                  </h4>
                                  <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                                    当前给予分值: <span className="font-mono font-black text-sm text-blue-900">{(manualScores[q.id] || 0)}</span> 分
                                  </span>
                                </div>
                                
                                {/* Sliders tool */}
                                <div className="flex items-center space-x-3">
                                  <span className="text-xs text-slate-400">0分</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="25"
                                    value={manualScores[q.id] || 0}
                                    id={`slider-marking-${q.id}`}
                                    onChange={(e) => handleUpdateProgrammingScore(q.id, parseInt(e.target.value, 10))}
                                    className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                                  />
                                  <span className="text-xs text-slate-400">25分</span>
                                </div>
                              </div>

                              {/* Direct type in box or Feedback marks */}
                              <div className="flex flex-row items-center space-x-2 shrink-0 w-full sm:w-auto">
                                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">分值微调：</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="25"
                                  value={manualScores[q.id] || 0}
                                  id={`input-marking-${q.id}`}
                                  onChange={(e) => {
                                    let parsed = parseInt(e.target.value, 10);
                                    if (isNaN(parsed)) parsed = 0;
                                    const constrained = Math.max(0, Math.min(25, parsed));
                                    handleUpdateProgrammingScore(q.id, constrained);
                                  }}
                                  className="w-16 p-2 text-center bg-white border border-slate-300 rounded-xl text-sm font-extrabold font-mono text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>

                            </div>

                          </div>
                        )}

                        {/* Compelling analysis card for all questions */}
                        <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl relative">
                          <h4 className="text-xs font-extrabold text-slate-705 flex items-center mb-1.5 select-none">
                            <BookOpen className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                            知识点精细拆解 / 解析剖析：
                          </h4>
                          <div className="text-xs text-slate-600 leading-relaxed font-sans mt-2">
                            <RichTextRenderer text={q.explanation} fontSizeClass="text-xs text-slate-600" />
                          </div>
                          <div className="mt-2 text-[10px] text-slate-400 font-mono">
                            考点所属：{q.knowledgePoints.join(' / ')}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}

            </div>

          </div>
        )}

      </main>

      {/* --- Footer Accent lines --- */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-600 uppercase font-mono tracking-wider">GESP C++ Certified</span>
            <span>|</span>
            <span>模拟认证考试实验室v1.2</span>
          </div>
          <div>
            基于 2026年3月 GESP 官方 5级 试卷标准开发。考查初等数论、非自适应分治、双向循环链表及高精度求值算法。
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* --- DIALOG MODALS                                      --- */}
      {/* ========================================================= */}

      {/* 2. Over-Timer AUTO SUBMISSION Alert Overlay */}
      {showAutoSubmitAlert && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="auto-submit-dialog">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">⏰ 考试倒计时时间到！</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                您的作答时间 120 分钟已经截止。为了维护考试真实性，系统此前一秒已经自动将已填的所有答案保存并完美提交！
              </p>
            </div>
            <button
              onClick={() => {
                setShowAutoSubmitAlert(false);
                setViewMode('sheet');
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-all"
            >
              立刻查阅试卷评分 & 手动阅卷
            </button>
          </div>
        </div>
      )}

      {/* 3. CONFIRM MANUAL SUBMIT DIALOG */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="confirm-submit-dialog">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-65s flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">交卷确认提醒</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                您当前还有部分富余答题时间（余 {formatTime(timeRemaining)}）。
                交卷后本试卷的选择题与判断题共 50 分将被自动归档锁定，不能再作修改修改。
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-400 mt-2 border border-slate-100 font-mono">
                已答：{answeredQuestionsCount}题 / 未做：{totalQuestions - answeredQuestionsCount}题
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setConfirmSubmitOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl cursor-pointer transition-all"
              >
                回到答卷区继续写
              </button>
              <button
                onClick={submitExamAnswers}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl cursor-pointer shadow-md transition-all"
              >
                确认交卷
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
