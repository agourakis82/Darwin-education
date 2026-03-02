'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, CheckCircle, XCircle, Edit, ArrowRight } from 'lucide-react';
import { IngestedQuestion } from '@/lib/mcp-ingestion/types';

interface IngestionRunSummary {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  links_found: number | null;
  links_allowed: number | null;
  links_review: number | null;
  links_blocked: number | null;
  questions_extracted: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface IngestionRunsApiSummary {
  total_runs: number;
  total_links_found: number;
  total_allow: number;
  total_review: number;
  total_blocked: number;
  total_questions_extracted: number;
}

export default function CurationDashboard() {
  const [questions, setQuestions] = useState<IngestedQuestion[]>([]);
  const [runs, setRuns] = useState<IngestionRunSummary[]>([]);
  const [runsSummary, setRunsSummary] = useState<IngestionRunsApiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [runsLoading, setRunsLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchPendingQuestions();
    fetchRecentRuns();
  }, []);

  async function fetchPendingQuestions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('ingested_questions')
      .select('*')
      .in('status', ['pending', 'needs_review', 'conflict'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setQuestions(data as IngestedQuestion[]);
    }
    setLoading(false);
  }

  async function fetchRecentRuns() {
    setRunsLoading(true);
    try {
      const response = await fetch('/api/ingestion/runs?limit=10');
      const payload = await response.json();

      if (payload?.success) {
        setRuns((payload.runs || []) as IngestionRunSummary[]);
        setRunsSummary((payload.summary || null) as IngestionRunsApiSummary | null);
      }
    } catch (error) {
      console.error(error);
    }
    setRunsLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('ingested_questions')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } else {
      alert('Failed to update status');
    }
  }

  function inferPolicyDecision(question: IngestedQuestion): 'allow' | 'review' | 'block' | null {
    if (question.source_policy_decision) return question.source_policy_decision;
    if (!question.curator_notes) return null;
    try {
      const parsed = JSON.parse(question.curator_notes) as {
        source_policy?: { decision?: unknown };
      };
      const decision = String(parsed.source_policy?.decision || '').toLowerCase();
      if (decision === 'allow' || decision === 'review' || decision === 'block') return decision;
      return null;
    } catch {
      return null;
    }
  }

  async function handleTriggerIngestion() {
    setTriggering(true);
    try {
      await fetch('/api/ingestion/trigger', { method: 'POST' });
      alert('Ingestion background job triggered.');
      await fetchRecentRuns();
    } catch (e) {
      console.error(e);
    }
    setTriggering(false);
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Curation Dashboard</h1>
          <p className="text-slate-500">Review newly ingested medical questions.</p>
        </div>
        <button
          onClick={handleTriggerIngestion}
          disabled={triggering}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {triggering ? <Loader2 className="animate-spin w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          Trigger MCP Search
        </button>
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Recent Ingestion Runs</h2>
          <button
            onClick={fetchRecentRuns}
            className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {runsSummary && (
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-6">
            <div className="rounded bg-slate-50 px-2 py-1">
              <div className="text-slate-500">Runs</div>
              <div className="font-semibold text-slate-800">{runsSummary.total_runs}</div>
            </div>
            <div className="rounded bg-slate-50 px-2 py-1">
              <div className="text-slate-500">Links</div>
              <div className="font-semibold text-slate-800">{runsSummary.total_links_found}</div>
            </div>
            <div className="rounded bg-green-50 px-2 py-1">
              <div className="text-green-700">Allow</div>
              <div className="font-semibold text-green-800">{runsSummary.total_allow}</div>
            </div>
            <div className="rounded bg-amber-50 px-2 py-1">
              <div className="text-amber-700">Review</div>
              <div className="font-semibold text-amber-800">{runsSummary.total_review}</div>
            </div>
            <div className="rounded bg-red-50 px-2 py-1">
              <div className="text-red-700">Blocked</div>
              <div className="font-semibold text-red-800">{runsSummary.total_blocked}</div>
            </div>
            <div className="rounded bg-blue-50 px-2 py-1">
              <div className="text-blue-700">Extracted</div>
              <div className="font-semibold text-blue-800">
                {runsSummary.total_questions_extracted}
              </div>
            </div>
          </div>
        )}

        {runsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : runs.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">No ingestion runs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2 font-medium">Started</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Links</th>
                  <th className="px-2 py-2 font-medium">Allow</th>
                  <th className="px-2 py-2 font-medium">Review</th>
                  <th className="px-2 py-2 font-medium">Blocked</th>
                  <th className="px-2 py-2 font-medium">Extracted</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-slate-100 text-slate-700">
                    <td className="px-2 py-2">{new Date(run.started_at).toLocaleString()}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                          run.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : run.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : run.status === 'running'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-2 py-2">{run.links_found ?? 0}</td>
                    <td className="px-2 py-2">{run.links_allowed ?? 0}</td>
                    <td className="px-2 py-2">{run.links_review ?? 0}</td>
                    <td className="px-2 py-2">{run.links_blocked ?? 0}</td>
                    <td className="px-2 py-2">{run.questions_extracted ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500">No pending questions to review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q) => {
            const policyDecision = inferPolicyDecision(q);
            return (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2 items-center">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold uppercase">
                    {q.exam_type || 'Unknown Source'} {q.year || ''}
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold uppercase">
                    {q.area || 'Unclassified'}
                  </span>
                  {policyDecision && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                        policyDecision === 'allow'
                          ? 'bg-green-50 text-green-700'
                          : policyDecision === 'review'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      source {policyDecision}
                    </span>
                  )}
                  {q.status === 'conflict' && (
                    <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                      CONFLICT
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  ID: {q.id.split('-')[0]}...
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-slate-800 mb-2">Stem:</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{q.stem}</p>
              </div>

              <div className="space-y-2 mb-6">
                {q.options?.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      q.correct_index === idx
                        ? 'border-green-300 bg-green-50 text-green-900'
                        : 'border-slate-100 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold mr-2">{opt.letter})</span>
                    {opt.text}
                    {q.correct_index === idx && (
                      <span className="ml-2 text-xs font-bold text-green-600 uppercase">
                        (Official Key)
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => updateStatus(q.id, 'rejected')}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Discard
                </button>
                <button
                  onClick={() => alert('Edit feature placeholder')}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => updateStatus(q.id, 'approved')}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Approve & Save
                </button>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
