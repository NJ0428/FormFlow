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
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface Form {
  id: number;
  title: string;
  description: string | null;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#8dd1e1'];

export default function SurveyResultsPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const [responses, setResponses] = useState<Response[]>([]);
  const [questions, setQuestions] = useState<QuestionStats[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'responses'>('overview');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      setForm(formData.form);
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

  const exportToCSV = (exportType: 'individual' | 'aggregate' = 'individual') => {
    if (responses.length === 0) {
      alert('내보낼 응답이 없습니다.');
      return;
    }

    if (exportType === 'individual') {
      // 개별 응답 내보내기
      let csv = '제출 시간,';
      questions.forEach((q, idx) => {
        csv += `"${q.title}"${idx < questions.length - 1 ? ',' : ''}`;
      });
      csv += '\n';

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

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${form?.title || 'survey'}_individual_responses.csv`;
      link.click();
    } else {
      // 집계 데이터 내보내기
      let csv = '질문,유형,응답 수,응답률,';

      // 최대 응답 수만큼 열 추가
      const maxResponses = Math.max(...questions.map(q => q.totalResponses));
      for (let i = 1; i <= maxResponses; i++) {
        csv += `응답 ${i},`;
      }
      csv = csv.slice(0, -1);
      csv += '\n';

      questions.forEach((q) => {
        const typeMap: Record<string, string> = {
          short_text: '단답형',
          long_text: '장문형',
          single: '단일 선택',
          multiple: '복수 선택',
          rating: '별점'
        };

        csv += `"${q.title}","${typeMap[q.type]}",${q.totalResponses},${responses.length > 0 ? ((q.totalResponses / responses.length) * 100).toFixed(1) : 0}%,"`;

        if (q.type === 'short_text' || q.type === 'long_text') {
          csv += q.textAnswers.join(' | ').replace(/"/g, '""');
        } else if (q.answerCount) {
          const answers = Object.entries(q.answerCount)
            .map(([key, count]) => `${key}: ${count}명 (${q.answerPercentage[key]?.toFixed(1) || 0}%)`)
            .join(' | ');
          csv += answers.replace(/"/g, '""');
        }
        csv += '"\n';
      });

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${form?.title || 'survey'}_aggregate_data.csv`;
      link.click();
    }
  };

  const exportToExcel = async (exportType: 'individual' | 'aggregate' = 'individual') => {
    if (responses.length === 0) {
      alert('내보낼 응답이 없습니다.');
      return;
    }

    setExporting(true);

    try {
      if (exportType === 'individual') {
        // 개별 응답 워크북
        const wb = XLSX.utils.book_new();

        // 메인 시트 데이터
        const mainData: any[][] = [
          ['설문조사 제목', form?.title || ''],
          ['설명', form?.description || ''],
          ['총 응답 수', responses.length.toString()],
          ['내보내기 날짜', new Date().toLocaleString('ko-KR')],
          [],
          ['제출 시간', ...questions.map(q => q.title)]
        ];

        responses.forEach((response) => {
          const row: any[] = [new Date(response.submitted_at).toLocaleString('ko-KR')];
          questions.forEach((q) => {
            const answer = response.answers.find((a: Answer) => a.question_id === q.id);
            let answerText = '';
            if (answer && answer.answer) {
              if (q.type === 'multiple') {
                answerText = JSON.parse(answer.answer as string).join(', ');
              } else {
                answerText = String(answer.answer);
              }
            }
            row.push(answerText || '-');
          });
          mainData.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(mainData);
        XLSX.utils.book_append_sheet(wb, ws, '개별 응답');

        // 집계 시트
        const aggregateData: any[][] = [
          ['질문', '유형', '응답 수', '응답률', '상세']
        ];

        questions.forEach((q) => {
          const typeMap: Record<string, string> = {
            short_text: '단답형',
            long_text: '장문형',
            single: '단일 선택',
            multiple: '복수 선택',
            rating: '별점'
          };

          let detail = '';
          if (q.type === 'short_text' || q.type === 'long_text') {
            detail = q.textAnswers.slice(0, 5).join(' | ');
          } else if (q.answerCount) {
            detail = Object.entries(q.answerCount)
              .map(([key, count]) => `${key}: ${count}명 (${q.answerPercentage[key]?.toFixed(1) || 0}%)`)
              .join(', ');
          }

          aggregateData.push([
            q.title,
            typeMap[q.type],
            q.totalResponses,
            responses.length > 0 ? `${((q.totalResponses / responses.length) * 100).toFixed(1)}%` : '0%',
            detail
          ]);
        });

        const wsAggregate = XLSX.utils.aoa_to_sheet(aggregateData);
        XLSX.utils.book_append_sheet(wb, wsAggregate, '집계 데이터');

        XLSX.writeFile(wb, `${form?.title || 'survey'}_responses.xlsx`);
      } else {
        // 집계 데이터만 내보내기
        const wb = XLSX.utils.book_new();

        const summaryData: any[][] = [
          ['설문조사 제목', form?.title || ''],
          ['설명', form?.description || ''],
          ['총 응답 수', responses.length.toString()],
          ['질문 수', questions.length.toString()],
          ['내보내기 날짜', new Date().toLocaleString('ko-KR')],
          [],
          ['질문별 통계'],
          []
        ];

        questions.forEach((q, index) => {
          const typeMap: Record<string, string> = {
            short_text: '단답형',
            long_text: '장문형',
            single: '단일 선택',
            multiple: '복수 선택',
            rating: '별점'
          };

          summaryData.push([`Q${index + 1}. ${q.title}`, typeMap[q.type], `${q.totalResponses}명 응답`]);

          if (q.answerCount && Object.keys(q.answerCount).length > 0) {
            summaryData.push(['', '응답 옵션', '응답 수', '비율']);
            Object.entries(q.answerCount)
              .sort((a, b) => b[1] - a[1])
              .forEach(([option, count]) => {
                summaryData.push(['', option, count, `${q.answerPercentage[option]?.toFixed(1)}%`]);
              });
          } else if (q.textAnswers.length > 0) {
            summaryData.push(['', '응답 내용']);
            q.textAnswers.slice(0, 10).forEach((answer) => {
              summaryData.push(['', answer]);
            });
          }
          summaryData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws, '집계 데이터');

        XLSX.writeFile(wb, `${form?.title || 'survey'}_aggregate.xlsx`);
      }

      setExportModalOpen(false);
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Excel 내보내기 중 오류가 발생했습니다.');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async (exportType: 'individual' | 'aggregate' = 'individual') => {
    if (responses.length === 0) {
      alert('내보낼 응답이 없습니다.');
      return;
    }

    setExporting(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // 제목
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text(form?.title || '설문조사 결과', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`총 응답 수: ${responses.length}명 | 질문 수: ${questions.length}개`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      doc.text(`내보내기 날짜: ${new Date().toLocaleString('ko-KR')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      if (exportType === 'individual') {
        // 개별 응답 테이블
        const tableData = responses.map((response, idx) => {
          const row: any[] = [idx + 1, new Date(response.submitted_at).toLocaleString('ko-KR')];
          questions.forEach((q) => {
            const answer = response.answers.find((a: Answer) => a.question_id === q.id);
            let answerText = '';
            if (answer && answer.answer) {
              if (q.type === 'multiple') {
                answerText = JSON.parse(answer.answer as string).join(', ');
              } else {
                answerText = String(answer.answer);
              }
              // 텍스트 길이 제한
              if (answerText.length > 30) {
                answerText = answerText.substring(0, 30) + '...';
              }
            }
            row.push(answerText || '-');
          });
          return row;
        });

        const headers = ['번호', '제출 시간', ...questions.map(q => q.title.length > 15 ? q.title.substring(0, 15) + '...' : q.title)];

        autoTable(doc, {
          startY: yPosition,
          head: [headers],
          body: tableData,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [102, 51, 153],
            textColor: 255,
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [245, 240, 255],
          },
          margin: { top: 10, left: 10, right: 10 },
        });

        doc.save(`${form?.title || 'survey'}_individual_responses.pdf`);
      } else {
        // 집계 데이터
        questions.forEach((q, index) => {
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
          }

          // 질문 제목
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          const questionTitle = `Q${index + 1}. ${q.title}`;
          const titleLines = doc.splitTextToSize(questionTitle, pageWidth - 20);
          doc.text(titleLines, 10, yPosition);
          yPosition += titleLines.length * 7 + 5;

          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');

          const typeMap: Record<string, string> = {
            short_text: '단답형',
            long_text: '장문형',
            single: '단일 선택',
            multiple: '복수 선택',
            rating: '별점'
          };

          doc.text(`유형: ${typeMap[q.type]} | 응답 수: ${q.totalResponses}명 (${responses.length > 0 ? ((q.totalResponses / responses.length) * 100).toFixed(1) : 0}%)`, 10, yPosition);
          yPosition += 10;

          // 응답 통계 테이블
          if (q.answerCount && Object.keys(q.answerCount).length > 0) {
            const statsData = Object.entries(q.answerCount)
              .sort((a, b) => b[1] - a[1])
              .map(([option, count]) => [
                option,
                count.toString(),
                `${q.answerPercentage[option]?.toFixed(1)}%`
              ]);

            autoTable(doc, {
              startY: yPosition,
              head: [['응답', '인원', '비율']],
              body: statsData,
              styles: {
                fontSize: 9,
                cellPadding: 3,
              },
              headStyles: {
                fillColor: [102, 51, 153],
                textColor: 255,
                fontStyle: 'bold',
              },
              columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 30 },
                2: { cellWidth: 30 },
              },
              margin: { left: 10, right: 10 },
            });

            yPosition = (doc as any).lastAutoTable.finalY + 10;
          } else if (q.textAnswers.length > 0) {
            // 텍스트 응답
            q.textAnswers.slice(0, 5).forEach((answer) => {
              if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
              }
              const lines = doc.splitTextToSize(`• ${answer}`, pageWidth - 25);
              doc.text(lines, 15, yPosition);
              yPosition += lines.length * 5 + 3;
            });
          }

          yPosition += 10;
        });

        doc.save(`${form?.title || 'survey'}_aggregate_data.pdf`);
      }

      setExportModalOpen(false);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF 내보내기 중 오류가 발생했습니다.');
    } finally {
      setExporting(false);
    }
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
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              내보내기
            </button>
          </div>
        </div>
      </header>

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">응답 내보내기</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    형식과 데이터 유형을 선택하세요
                  </p>
                </div>
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Format Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">파일 형식</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => exportToCSV('individual')}
                    disabled={exporting}
                    className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 dark:text-white">CSV</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">엑셀에서 열기</p>
                    </div>
                  </button>

                  <button
                    onClick={() => exportToExcel('individual')}
                    disabled={exporting}
                    className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 dark:text-white">Excel</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">여러 시트 지원</p>
                    </div>
                  </button>

                  <button
                    onClick={() => exportToPDF('individual')}
                    disabled={exporting}
                    className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 dark:text-white">PDF</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">인쇄용 보고서</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Data Type Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">데이터 유형</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Individual Responses */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">개별 응답</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          각 응답자의 답변을 별도 행으로 내보냅니다. 상세 분석에 적합합니다.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => exportToCSV('individual')}
                        disabled={exporting}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        CSV
                      </button>
                      <button
                        onClick={() => exportToExcel('individual')}
                        disabled={exporting}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Excel
                      </button>
                      <button
                        onClick={() => exportToPDF('individual')}
                        disabled={exporting}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* Aggregate Data */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">집계 데이터</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          통계가 요약된 데이터를 내보냅니다. 보고서 작성에 적합합니다.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => exportToCSV('aggregate')}
                        disabled={exporting}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        CSV
                      </button>
                      <button
                        onClick={() => exportToExcel('aggregate')}
                        disabled={exporting}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Excel
                      </button>
                      <button
                        onClick={() => exportToPDF('aggregate')}
                        disabled={exporting}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Info */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1">내보내기 형식 안내</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>CSV:</strong> 가볍고 호환성이 좋습니다. 엑셀에서 바로 열 수 있습니다.</li>
                      <li>• <strong>Excel:</strong> 여러 시트와 서식을 지원합니다. 복잡한 데이터에 적합합니다.</li>
                      <li>• <strong>PDF:</strong> 인쇄용 보고서나 공유용 문서에 적합합니다.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading Overlay */}
            {exporting && (
              <div className="absolute inset-0 bg-white bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">내보내는 중...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
