import React, { useState } from 'react';
import axios from 'axios';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { githubDark } from '@uiw/codemirror-theme-github';
import './App.css';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Language extensions mapping
  const languageExtensions = {
    python: python(),
    javascript: javascript(),
    cpp: cpp()
  };

  const handleDebug = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:5001/analyze?_=${Date.now()}`,
        {
          code: code || "for i in range(5): print(i)", // Fallback test code
          language: language || "python"
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error:', error);
      setAnalysis({
        error: error.response?.data?.message || 
               `HTTP ${error.response?.status}: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Code Debugger</h1>
        
        <div className="language-selector">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        <div className="code-editor-container">
          <CodeMirror
            value={code}
            height="300px"
            extensions={[languageExtensions[language]]}
            theme={githubDark}
            onChange={(value) => setCode(value)}
          />
        </div>

        <button 
          onClick={handleDebug}
          disabled={loading}
          className="debug-button"
        >
          {loading ? 'Analyzing...' : 'Debug with AI'}
        </button>

        {analysis && (
          <div className="analysis-results">
            {analysis.error ? (
              <div className="error-message">
                Error: {analysis.error}
              </div>
            ) : (
              <>
                {analysis.errors?.length > 0 && (
                  <div className="errors-section">
                    <h3>Errors Found:</h3>
                    <ul>
                      {analysis.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.suggestions?.length > 0 && (
                  <div className="suggestions-section">
                    <h3>Suggestions:</h3>
                    <ul>
                      {analysis.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.ai_analysis && (
                  <div className="ai-analysis">
                    <h3>AI Analysis:</h3>
                    <pre>{analysis.ai_analysis}</pre>
                  </div>
                )}

                {analysis.corrected_code && (
                  <div className="corrected-code">
                    <h3>Corrected Code:</h3>
                    <pre>{analysis.corrected_code}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;