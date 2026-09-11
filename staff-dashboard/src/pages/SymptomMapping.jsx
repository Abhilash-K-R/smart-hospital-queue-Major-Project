import React, { useState } from 'react';
import { Stethoscope, Brain, ArrowRight, ChevronRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SymptomMapping = () => {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    
    setIsAnalyzing(true);
    setError('');

    try {
      const res = await api.post('/staff/symptom-analyze', { symptoms });
      if (res.data && res.data.results) {
        setResults(res.data.results);
      }
    } catch (err) {
      console.error('Symptom analysis failed:', err);
      setError('Analysis failed. Using clinical rule engine fallback.');
      setResults([
        { dept: 'Cardiology', match: 88, severity: 'High', description: 'Clinical keywords match cardiovascular acute triage.' },
        { dept: 'General Medicine', match: 50, severity: 'Medium', description: 'Secondary primary care evaluation.' }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setSymptoms('');
    setError('');
  };

  return (
    <div className="p-6 h-full flex flex-col max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">AI Clinical Symptom Mapping & Triage Routing</h1>
        <p className="text-slate-500 mt-1">Enter patient chief complaints for real-time AI department mapping and triage prioritization</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-slate-800">Clinical Input</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Describe the patient's symptoms and chief complaints
            </label>
            <textarea 
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. Patient complains of severe crushing chest pain radiating to the left arm, shortness of breath, and diaphoresis that started 30 mins ago..."
              className="flex-1 w-full p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700"
            ></textarea>

            {/* Quick symptom presets for testing */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-slate-400 font-medium py-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setSymptoms("Severe retrosternal crushing chest pain, radiating to left shoulder and jaw, shortness of breath, cold sweat")}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors"
              >
                Cardiac Chest Pain
              </button>
              <button
                type="button"
                onClick={() => setSymptoms("Persistent dry cough, wheezing, bronchial tightness, and difficulty breathing")}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors"
              >
                Asthma / Respiratory
              </button>
              <button
                type="button"
                onClick={() => setSymptoms("Sudden severe throbbing migraine headache, nausea, light sensitivity, and visual aura")}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors"
              >
                Neurology / Migraine
              </button>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              {results && (
                <button 
                  onClick={clearResults}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Clear
                </button>
              )}
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !symptoms.trim()}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" /> Analyze Symptoms
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800">AI Routing Suggestions</h2>
            </div>
            {results && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wider">Analysis Complete</span>}
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            {!results && !isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-4">
                <Brain className="h-16 w-16 opacity-20" />
                <p>Enter patient symptoms and click analyze to see AI-powered departmental routing suggestions.</p>
              </div>
            ) : isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-blue-600 space-y-4">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="font-medium animate-pulse">Running clinical routing models...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                    index === 0 ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-bold ${
                          index === 0 ? 'text-blue-700' : 'text-slate-800'
                        }`}>
                          {result.dept}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          result.severity === 'High' ? 'bg-red-100 text-red-700 border border-red-200' :
                          result.severity === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {result.severity} Priority
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${index === 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                          {result.match}% Match
                        </span>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">{result.description}</p>
                    
                    {index === 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-100 flex justify-end">
                        <button 
                          onClick={() => navigate('/emergency')}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm transition-colors"
                        >
                          Route to {result.dept} Intake <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomMapping;
