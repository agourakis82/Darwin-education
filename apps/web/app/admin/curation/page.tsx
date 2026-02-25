'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, CheckCircle, XCircle, Edit, ArrowRight } from 'lucide-react';
import { IngestedQuestion } from '@/lib/mcp-ingestion/types';

export default function CurationDashboard() {
  const [questions, setQuestions] = useState<IngestedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchPendingQuestions();
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

  async function handleTriggerIngestion() {
    setTriggering(true);
    try {
      await fetch('/api/ingestion/trigger', { method: 'POST' });
      alert('Ingestion background job triggered.');
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
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2 items-center">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold uppercase">
                    {q.exam_type || 'Unknown Source'} {q.year || ''}
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold uppercase">
                    {q.area || 'Unclassified'}
                  </span>
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
          ))}
        </div>
      )}
    </div>
  );
}
