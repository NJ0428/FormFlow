'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Answer {
  question_id: number;
  answer: string | null;
  question_title: string;
  question_type: string;
  options?: string[];
}

interface Response {
  id: number;
  submitted_at: string;
  answers: Answer[];
}

interface QuestionStats {
  id: number;
  title: string;
  type: string;
  options?: string[];
  totalResponses: number;
  answerCount: Record<string, number>;
  answerPercentage: Record<string, number>;
  textAnswers: string[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#8dd1e1'];

export default function SurveyResultsPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const [responses, setResponses] = useState<Response[]>([]);
  const [questions, setQuestions] = useState<QuestionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'responses'>('overview');

  useEffect(() => {
    fetchData();
  }, [surveyId]);

  const fetchData = async () => {
    try {
      // Get form data
      const formRes = await fetch(`/api/forms/${surveyId}`);
      if (!formRes.ok) {
        throw new Error('설문조사를 찾을 수 없습니다.');
      }
      const formData = await formRes.json();
      const form = formData.form;

      // Get responses with answers
      const responsesRes = await fetch(`/api/forms/${surveyId}/responses`);
      if (!responsesRes.ok) {
        throw new Error('응답 데이터를 가져올 수 없습니다.');
      }
      const responsesData = await responsesRes.json();
      setResponses(responsesData.responses);

      // Calculate statistics for each question
      const stats = form.questions.map((q: any) => {
        const answers = responsesData.responses
          .map((r: Response) => r.answers.find((a: Answer) => a.question_id === q.id))
          .filter((a: Answer | undefined) => a && a.answer !== null);

        if (q.type === 'single' || q.type === 'multiple') {
          const answerCount: Record<string, number> = {};
          answers.forEach((a: Answer) => {
            if (a.answer) {
              if (q.type === 'multiple') {
                const values = JSON.parse(a.answer as string);
                values.forEach((v: string) => {
                  answerCount[v] = (answerCount[v] || 0) + 1;
                });
              } else {
                answerCount[a.answer as string] = (answerCount[a.answer as string] || 0) + 1;
              }
            }
          });

          const answerPercentage: Record<string, number> = {};
          Object.keys(answerCount).forEach(key => {
            answerPercentage[key] = (answerCount[key] / answers.length) * 100;
          });

          return {
            id: q.id,
            title: q.title,
            type: q.type,
            options: q.options,
            totalResponses: answers.length,
            answerCount,
            answerPercentage,
            textAnswers: [],
          };
        } else if (q.type === 'rating') {
          const answerCount: Record<string, number> = {};
          for (let i = 1; i <= 5; i++) {
            answerCount[i.toString()] = 0;
          }
          answers.forEach((a: Answer) => {
            if (a.answer) {
              answerCount[a.answer as string] = (answerCount[a.answer as string] || 0) + 1;
            }
          });

          const answerPercentage: Record<string, number> = {};
          Object.keys(answerCount).forEach(key => {
            answerPercentage[key] = (answerCount[key] / answers.length) * 100;
          });

          return {
            id: q.id,
            title: q.title,
            type: q.type,
            totalResponses: answers.length,
            answerCount,
            answerPercentage,
            textAnswers: [],
          };
        } else {
          // Text questions
          const textAnswers = answers.map((a: Answer) => a.answer as string);
          return {
            id: q.id,
            title: q.title,
            type: q.type,
            totalResponses: answers.length,
            answerCount: {},
            answerPercentage: {},
            textAnswers,
          };
        }
      });

      setQuestions(stats);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (responses.length === 0) return;

    // Create CSV header
    let csv = '제출 시간,';
    questions.forEach((q, idx) => {
      csv += `"${q.title}"${idx < questions.length - 1 ? ',' : ''}`;
    });
    csv += '\n';

    // Add data rows
    responses.forEach((response) => {
      csv += `"${new Date(response.submitted_at).toLocaleString('ko-KR')}",`;
      questions.forEach((q, idx) => {
        const answer = response.answers.find((a: Answer) => a.question_id === q.id);
        let answerText = '';
        if (answer && answer.answer) {
          if (q.type === 'multiple') {
            answerText = JSON.stringify(JSON.parse(answer.answer as string)).replace(/"/g, '""');
          } else {
            answerText = String(answer.answer).replace(/"/g, '""');
          }
        }
        csv += `"${answerText}"${idx < questions.length - 1 ? ',' : ''}`;
      });
      csv += '\n';
    });

    // Download file
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `survey_${surveyId}_responses.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 border-opacity-75 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">오류 발생</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => router.push('/mypage')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            마이페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/mypage')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              뒤로가기
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">응답 분석</h1>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              📥 CSV 내보내기
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">총 응답 수</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{responses.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112-12V4a6 6 0 0110-12h2.547" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">질문 수</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{questions.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.657 2.27-3 5.772-3h2.994c3.501 0 6.353 2.853 6.353 6.353v1a6 6 0 01-1 6h-2.994c-3.501 0-6.353-2.853-6.353-6.353v-1a6 6 0 011-6H8.228z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">평균 응답률</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {responses.length > 0
                      ? Math.round(questions.reduce((acc, q) => acc + q.totalResponses, 0) / (questions.length * responses.length) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm2-6V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2 mb-8 inline-flex">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-6 py-2 rounded-lg transition ${
                viewMode === 'overview'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              📊 통계 보기
            </button>
            <button
              onClick={() => setViewMode('responses')}
              className={`px-6 py-2 rounded-lg transition ${
                viewMode === 'responses'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              📋 응답 목록
            </button>
          </div>

          {/* Overview Mode */}
          {viewMode === 'overview' && (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          Q{index + 1}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {question.type === 'short_text' && '단답형'}
                          {question.type === 'long_text' && '장문형'}
                          {question.type === 'single' && '단일 선택'}
                          {question.type === 'multiple' && '복수 선택'}
                          {question.type === 'rating' && '별점'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {question.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {question.totalResponses}명 응답 / 총 {responses.length}명 중
                        {responses.length > 0 && (
                          <span className="ml-2">
                            ({Math.round((question.totalResponses / responses.length) * 100)}%)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Charts for choice/rating questions */}
                  {(question.type === 'single' || question.type === 'multiple' || question.type === 'rating') && (
                    <div className="mt-6">
                      {question.type === 'rating' ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={Object.entries(question.answerCount).map(([label, value]) => ({ label, value }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" label="평점" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                            data={Object.entries(question.answerCount).map(([label, value]) => ({
                              name: label,
                              value
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.entries(question.answerCount).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}

                      {/* Detailed breakdown */}
                      <div className="mt-6 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">상세 통계</h4>
                        {Object.entries(question.answerCount)
                          .sort((a, b) => b[1] - a[1])
                          .map(([option, count]) => (
                            <div key={option} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <span className="text-gray-700 dark:text-gray-300">
                                {option || '(미응답)'}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {count}명
                                </span>
                                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                  {question.answerPercentage[option]?.toFixed(1)}%
                                </span>
                                <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{ width: `${question.answerPercentage[option]}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Text answers */}
                  {(question.type === 'short_text' || question.type === 'long_text') && (
                    <div className="mt-4">
                      {question.textAnswers.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {question.textAnswers.map((answer, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                {answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">응답이 없습니다</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Responses Mode */}
          {viewMode === 'responses' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        번호
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        제출 시간
                      </th>
                      {questions.map((q) => (
                        <th key={q.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                          {q.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {responses.map((response, idx) => (
                      <tr key={response.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(response.submitted_at).toLocaleString('ko-KR')}
                        </td>
                        {questions.map((q) => {
                          const answer = response.answers.find((a: Answer) => a.question_id === q.id);
                          return (
                            <td key={q.id} className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {answer && answer.answer ? (
                                q.type === 'multiple' ? (
                                  <div className="flex flex-wrap gap-1">
                                    {JSON.parse(answer.answer as string).map((v: string, i: number) => (
                                      <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                                        {v}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="line-clamp-2">{String(answer.answer)}</span>
                                )
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {responses.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">아직 응답이 없습니다</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
