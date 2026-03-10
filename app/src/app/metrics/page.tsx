'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Copy, Check, Lock, Eye, EyeOff } from 'lucide-react';

interface MetricsData {
  totalRequests: number;
  uniqueEndpoints: Set<string>;
  statusCodes: Map<string, number>;
  requestDurations: number[];
  endpointStats: Map<string, { count: number; duration: number }>;
  errorRate: number;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<string>('');
  const [frontendMetrics, setFrontendMetrics] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState('http://localhost:8000');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [metricsHistory, setMetricsHistory] = useState<{ timestamp: number; data: MetricsData }[]>([]);
  const [activeTab, setActiveTab] = useState<'backend' | 'frontend'>('backend');

  useEffect(() => {
    // Get the microservice URL from env or default to localhost
    const envUrl = process.env.NEXT_PUBLIC_MICROSERVICE_URL;
    if (envUrl && !envUrl.includes('undefined')) {
      // If it's the Docker URL, convert to localhost for browser
      setBaseUrl(envUrl.replace('service:8000', 'localhost:8000'));
    } else {
      // Default to localhost for local development
      setBaseUrl('http://localhost:8000');
    }

    // Load saved API key from localStorage
    const savedApiKey = localStorage.getItem('prometheus_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
      fetchFrontendMetrics();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, baseUrl, apiKey]);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const metricsUrl = `${baseUrl}/metrics/`;
      const headers: Record<string, string> = {};
      
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
        // Save API key to localStorage
        localStorage.setItem('prometheus_api_key', apiKey);
      }
      
      const response = await fetch(metricsUrl, { headers });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch metrics: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.text();
      setMetrics(data);

      // Add to history for tracking
      const parsed = parseMetricsData(data);
      setMetricsHistory(prev => [...prev.slice(-59), { timestamp: Date.now(), data: parsed }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setMetrics('');
    } finally {
      setLoading(false);
    }
  };

  const fetchFrontendMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      if (!response.ok) {
        throw new Error(`Failed to fetch frontend metrics: ${response.status}`);
      }
      const data = await response.text();
      setFrontendMetrics(data);
    } catch (err) {
      console.error('Error fetching frontend metrics:', err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(metrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseMetrics = () => {
    const lines = metrics.split('\n').filter(line => !line.startsWith('#') && line.trim());
    return lines;
  };

  const parseMetricsData = (metricsText: string): MetricsData => {
    const lines = metricsText.split('\n').filter(line => !line.startsWith('#') && line.trim());
    const data: MetricsData = {
      totalRequests: 0,
      uniqueEndpoints: new Set<string>(),
      statusCodes: new Map<string, number>(),
      requestDurations: [],
      endpointStats: new Map<string, { count: number; duration: number }>(),
      errorRate: 0,
    };

    lines.forEach(line => {
      // Parse request totals
      if (line.includes('lingo_requests_total{')) {
        const statusMatch = line.match(/status="(\d+)"/);
        const endpointMatch = line.match(/endpoint="([^"]+)"/);
        const countMatch = line.match(/\}\s*([\d.]+)$/);

        if (statusMatch && countMatch) {
          const status = statusMatch[1];
          const count = parseInt(countMatch[1]);
          data.statusCodes.set(status, (data.statusCodes.get(status) || 0) + count);
          data.totalRequests += count;

          // Track error rate
          if (!status.startsWith('2')) {
            data.errorRate += count;
          }
        }

        if (endpointMatch) {
          data.uniqueEndpoints.add(endpointMatch[1]);
        }
      }

      // Parse request durations
      if (line.includes('lingo_request_duration_seconds_sum{')) {
        const durationMatch = line.match(/\}\s*([\d.]+)$/);
        if (durationMatch) {
          data.requestDurations.push(parseFloat(durationMatch[1]));
        }
      }

      // Parse endpoint statistics
      if (line.includes('lingo_requests_total{')) {
        const endpointMatch = line.match(/endpoint="([^"]+)"/);
        const countMatch = line.match(/\}\s*([\d.]+)$/);
        if (endpointMatch && countMatch) {
          const endpoint = endpointMatch[1];
          const count = parseInt(countMatch[1]);
          const current = data.endpointStats.get(endpoint) || { count: 0, duration: 0 };
          data.endpointStats.set(endpoint, { ...current, count: current.count + count });
        }
      }
    });

    // Calculate error rate percentage
    if (data.totalRequests > 0) {
      data.errorRate = (data.errorRate / data.totalRequests) * 100;
    }

    return data;
  };

  const getMetricsSummary = (): MetricsData => {
    return parseMetricsData(metrics);
  };

  const summary = metrics ? getMetricsSummary() : null;

  const avgResponseTime = summary && summary.requestDurations.length > 0
    ? (summary.requestDurations.reduce((a, b) => a + b, 0) / summary.requestDurations.length * 1000).toFixed(2)
    : 0;

  const requestsPerSecond = metricsHistory.length > 1
    ? ((metricsHistory[metricsHistory.length - 1].data.totalRequests - 
        metricsHistory[0].data.totalRequests) / ((metricsHistory[metricsHistory.length - 1].timestamp - 
        metricsHistory[0].timestamp) / 1000)).toFixed(2)
    : 0;

  const getStatusColor = (status: string) => {
    if (status.startsWith('2')) return 'text-green-400';
    if (status.startsWith('3')) return 'text-blue-400';
    if (status.startsWith('4')) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getErrorRate = (rate: number) => {
    if (rate < 1) return 'text-green-400';
    if (rate < 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Prometheus Metrics</h1>
          <p className="text-gray-400">Real-time monitoring dashboard for Lingo AI</p>
        </div>

        {/* Config Section */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Microservice URL */}
          <div className="lg:col-span-2 bg-slate-700/50 backdrop-blur p-6 rounded-lg border border-slate-600">
            <label className="block text-sm font-medium mb-3">Microservice URL</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && fetchMetrics()}
              />
              <button
                onClick={fetchMetrics}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded font-medium flex items-center gap-2 transition text-sm"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Loading...' : 'Fetch'}
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div className="bg-slate-700/50 backdrop-blur p-6 rounded-lg border border-slate-600">
            <label className="block text-sm font-medium mb-3">API Key (Optional)</label>
            <div className="flex gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Prometheus API key"
                className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-2 py-2 bg-slate-600 hover:bg-slate-500 rounded transition"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Auto-refresh Controls */}
        <div className="mb-6 bg-slate-700/50 backdrop-blur p-4 rounded-lg border border-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Auto Refresh</span>
            </label>
            {autoRefresh && (
              <div className="flex items-center gap-2">
                <label htmlFor="refresh-interval" className="text-sm text-gray-400">
                  Interval:
                </label>
                <select
                  id="refresh-interval"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-3 py-1 bg-slate-600 border border-slate-500 rounded text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value={2}>2s</option>
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                </select>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {metricsHistory.length > 0 && `History: ${metricsHistory.length} samples`}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-gap-3">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="font-semibold">Error</h3>
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          </div>
        )}

        {/* Key Metrics Summary */}
        {summary && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Requests */}
            <div className="bg-slate-700/50 backdrop-blur p-4 rounded-lg border border-slate-600">
              <div className="text-xs text-gray-400 mb-2 font-medium">Total Requests</div>
              <div className="text-3xl font-bold text-blue-400">{summary.totalRequests}</div>
              <div className="text-xs text-gray-500 mt-1">
                {requestsPerSecond} req/sec
              </div>
            </div>

            {/* Unique Endpoints */}
            <div className="bg-slate-700/50 backdrop-blur p-4 rounded-lg border border-slate-600">
              <div className="text-xs text-gray-400 mb-2 font-medium">Unique Endpoints</div>
              <div className="text-3xl font-bold text-cyan-400">{summary.uniqueEndpoints.size}</div>
              <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                {Array.from(summary.uniqueEndpoints).slice(0, 2).map(ep => (
                  <div key={ep} className="truncate">{ep}</div>
                ))}
                {summary.uniqueEndpoints.size > 2 && (
                  <div className="text-gray-400">+{summary.uniqueEndpoints.size - 2} more</div>
                )}
              </div>
            </div>

            {/* Avg Response Time */}
            <div className="bg-slate-700/50 backdrop-blur p-4 rounded-lg border border-slate-600">
              <div className="text-xs text-gray-400 mb-2 font-medium">Avg Response Time</div>
              <div className="text-3xl font-bold text-green-400">{avgResponseTime}ms</div>
              <div className="text-xs text-gray-500 mt-1">milliseconds</div>
            </div>

            {/* Success Rate */}
            <div className="bg-slate-700/50 backdrop-blur p-4 rounded-lg border border-slate-600">
              <div className="text-xs text-gray-400 mb-2 font-medium">Success Rate</div>
              <div className={`text-3xl font-bold ${(100 - summary.errorRate).toFixed(1) === '100.0' ? 'text-green-400' : 'text-yellow-400'}`}>
                {(100 - summary.errorRate).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">2xx status codes</div>
            </div>

            {/* Error Rate */}
            <div className={`bg-slate-700/50 backdrop-blur p-4 rounded-lg border ${summary.errorRate > 5 ? 'border-red-500' : 'border-slate-600'}`}>
              <div className="text-xs text-gray-400 mb-2 font-medium">Error Rate</div>
              <div className={`text-3xl font-bold ${getErrorRate(summary.errorRate)}`}>
                {summary.errorRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">4xx, 5xx codes</div>
            </div>
          </div>
        )}

        {/* Status Codes Breakdown */}
        {summary && (
          <div className="mb-6 bg-slate-700/50 backdrop-blur p-6 rounded-lg border border-slate-600">
            <h2 className="text-lg font-semibold mb-4">HTTP Status Codes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from(summary.statusCodes.entries()).map(([status, count]) => (
                <div key={status} className="bg-slate-800 p-3 rounded border border-slate-600 text-center">
                  <div className={`text-xl font-bold ${getStatusColor(status)}`}>{status}</div>
                  <div className="text-sm text-gray-400 mt-1">{count} requests</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Endpoints Performance */}
        {summary && summary.endpointStats.size > 0 && (
          <div className="mb-6 bg-slate-700/50 backdrop-blur p-6 rounded-lg border border-slate-600">
            <h2 className="text-lg font-semibold mb-4">Endpoint Performance</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Array.from(summary.endpointStats.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .map(([endpoint, stats]) => (
                  <div key={endpoint} className="flex items-center justify-between bg-slate-800 p-3 rounded border border-slate-600">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{endpoint}</div>
                      <div className="text-xs text-gray-400">Requests: {stats.count}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-blue-300">
                        {stats.count > 0 ? ((stats.duration / stats.count) * 1000).toFixed(0) : 0}ms
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        {metrics || frontendMetrics ? (
          <div className="mb-6 flex gap-2 border-b border-slate-600">
            <button
              onClick={() => setActiveTab('backend')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'backend'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Backend Metrics
            </button>
            <button
              onClick={() => setActiveTab('frontend')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'frontend'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Frontend Metrics
            </button>
          </div>
        ) : null}

        {/* Metrics Display */}
        {activeTab === 'backend' && metrics && (
          <div className="bg-slate-700/50 backdrop-blur p-6 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Raw Backend Metrics Output</h2>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm transition"
              >
                {copied ? (
                  <>
                    <Check size={16} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-900 rounded p-4 overflow-auto max-h-96 border border-slate-600">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
                {metrics}
              </pre>
            </div>
          </div>
        )}

        {/* Frontend Metrics Display */}
        {activeTab === 'frontend' && frontendMetrics && (
          <div className="bg-slate-700/50 backdrop-blur p-6 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Raw Frontend Metrics Output</h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(frontendMetrics);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm transition"
              >
                {copied ? (
                  <>
                    <Check size={16} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-900 rounded p-4 overflow-auto max-h-96 border border-slate-600">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
                {frontendMetrics}
              </pre>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!metrics && !error && (
          <div className="bg-slate-700/50 backdrop-blur p-12 rounded-lg border border-slate-600 text-center">
            <div className="text-gray-400 mb-4">
              <RefreshCw size={48} className="mx-auto opacity-50 mb-4" />
              <p>Enter your API key and click &quot;Fetch Metrics&quot; to view Prometheus metrics</p>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-slate-700/30 rounded text-sm text-gray-400">
          <p>💡 <strong>Note:</strong> Metrics endpoint is available at <code className="bg-slate-800 px-2 py-1 rounded">/metrics/</code> (with trailing slash)</p>
        </div>
      </div>
    </div>
  );
}
