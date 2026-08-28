import React, { useState } from 'react';
import { Stethoscope, Brain, ArrowRight, ChevronRight, Activity } from 'lucide-react';

const SymptomMapping = () => {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleAnalyze = () => {
    if (!symptoms.trim()) return;
    
    setIsAnalyzing(true);
    // Mock API call
    setTimeout(() => {
      setIsAnalyzing(false);
      setResults([
        { dept: 'Cardiology', match: 85, severity: 'High', description: 'Symptoms align with potential cardiac event.' },
        { dept: 'Pulmonology', match: 45, severity: 'Medium', description: 'Secondary possibility of respiratory distress.' },
        { dept: 'General Practice', match: 20, severity: 'Low', description: 'Monitor for generalized anxiety or stress.' }
      ]);
    }, 1500);
  };

  const clearResults = () => {
    setResults(null);
    setSymptoms('');
  };

  return (
    <div className="p-6 h-full flex flex-col max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">AI Symptom Mapping</h1>
        <p className="text-slate-500 mt-1">Enter patient symptoms for suggested departmental routing</p>
      </div>

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
                <p>Enter symptoms and click analyze to see AI-powered departmental routing suggestions.</p>
              </div>
            ) : isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-blue-600 space-y-4">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="font-medium animate-pulse">Running diagnostic models...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className={`border rounded-xl p-4 transition-all hover:shadow-md cursor-pointer ${
                    index === 0 ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-bold ${
                          index === 0 ? 'text-blue-700' : 'text-slate-800'
                        }`}>
                          {result.dept}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          result.severity === 'High' ? 'bg-red-100 text-red-700' :
                          result.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-emerald-100 text-emerald-700'
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
                        <button className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          Route to Cardiology <ArrowRight className="h-4 w-4" />
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
