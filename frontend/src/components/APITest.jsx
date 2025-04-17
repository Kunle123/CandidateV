import { useState, useEffect } from 'react';
import { 
  userService, 
  cvService, 
  exportService, 
  authService,
  aiService,
  paymentService 
} from '../api';

const APITest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [overallStatus, setOverallStatus] = useState({
    total: 0,
    success: 0,
    failed: 0
  });

  useEffect(() => {
    // Calculate overall status when results change
    const total = Object.keys(results).length;
    const success = Object.values(results).filter(r => r.success).length;
    const failed = total - success;
    
    setOverallStatus({ total, success, failed });
  }, [results]);

  const runTest = async (serviceName, testFn) => {
    setLoading(prev => ({ ...prev, [serviceName]: true }));
    setError(prev => ({ ...prev, [serviceName]: null }));
    
    try {
      const result = await testFn();
      setResults(prev => ({ 
        ...prev, 
        [serviceName]: {
          success: result.success,
          data: result.data
        }
      }));
    } catch (err) {
      console.error(`Test error (${serviceName}):`, err);
      setError(prev => ({ 
        ...prev, 
        [serviceName]: err.message || 'Unknown error' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [serviceName]: false }));
    }
  };

  // Test all services
  const testUserService = () => runTest('userService', userService.getCurrentProfile);
  const testCVService = () => runTest('cvService', cvService.getTemplates);
  const testExportService = () => runTest('exportService', exportService.getExportFormats);
  const testAIService = () => runTest('aiService', () => aiService.analyzeCV('sample-cv-id')); 
  const testPaymentService = () => runTest('paymentService', paymentService.getPlans);
  
  const testAuthStatus = () => {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();
    setResults(prev => ({ 
      ...prev, 
      authService: {
        success: true,
        data: { isAuthenticated, user }
      }
    }));
  };

  // Run all tests
  const runAllTests = () => {
    testAuthStatus();
    testUserService();
    testCVService();
    testExportService();
    testAIService();
    testPaymentService();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto my-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">API Service Test Dashboard</h2>
        <button 
          onClick={runAllTests}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Run All Tests
        </button>
      </div>

      {/* Overall Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-2">Overall Status</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-2 bg-blue-100 rounded">
            <div className="text-lg font-bold">{overallStatus.total}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>
          <div className="p-2 bg-green-100 rounded">
            <div className="text-lg font-bold text-green-700">{overallStatus.success}</div>
            <div className="text-sm text-gray-600">Success</div>
          </div>
          <div className="p-2 bg-red-100 rounded">
            <div className="text-lg font-bold text-red-700">{overallStatus.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Auth Status</h3>
          <button 
            onClick={testAuthStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Check Auth Status
          </button>
          
          {results.authService && (
            <div className="mt-2">
              <div>
                Authenticated: <span className={results.authService.data?.isAuthenticated ? "text-green-600" : "text-red-600"}>
                  {results.authService.data?.isAuthenticated ? 'Yes' : 'No'}
                </span>
              </div>
              {results.authService.data?.user && (
                <div className="text-sm">
                  User: {results.authService.data.user.name} ({results.authService.data.user.email})
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">User Service</h3>
          <button 
            onClick={testUserService}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading.userService}
          >
            {loading.userService ? 'Loading...' : 'Test User Service'}
          </button>
          
          {error.userService && (
            <div className="text-red-500 text-sm mt-2">
              Error: {error.userService}
            </div>
          )}
          
          {results.userService && (
            <div className="mt-2">
              <div>
                Status: <span className={results.userService.success ? "text-green-600" : "text-red-600"}>
                  {results.userService.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              {results.userService.success && results.userService.data && (
                <div className="text-sm">
                  Response received
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">CV Service</h3>
          <button 
            onClick={testCVService}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading.cvService}
          >
            {loading.cvService ? 'Loading...' : 'Test CV Service'}
          </button>
          
          {error.cvService && (
            <div className="text-red-500 text-sm mt-2">
              Error: {error.cvService}
            </div>
          )}
          
          {results.cvService && (
            <div className="mt-2">
              <div>
                Status: <span className={results.cvService.success ? "text-green-600" : "text-red-600"}>
                  {results.cvService.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              {results.cvService.success && results.cvService.data && (
                <div className="text-sm">
                  Templates: {results.cvService.data.total || 0}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Export Service</h3>
          <button 
            onClick={testExportService}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading.exportService}
          >
            {loading.exportService ? 'Loading...' : 'Test Export Service'}
          </button>
          
          {error.exportService && (
            <div className="text-red-500 text-sm mt-2">
              Error: {error.exportService}
            </div>
          )}
          
          {results.exportService && (
            <div className="mt-2">
              <div>
                Status: <span className={results.exportService.success ? "text-green-600" : "text-red-600"}>
                  {results.exportService.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              {results.exportService.success && results.exportService.data && (
                <div className="text-sm">
                  Available formats: {results.exportService.data.formats?.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">AI Service</h3>
          <button 
            onClick={testAIService}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading.aiService}
          >
            {loading.aiService ? 'Loading...' : 'Test AI Service'}
          </button>
          
          {error.aiService && (
            <div className="text-red-500 text-sm mt-2">
              Error: {error.aiService}
            </div>
          )}
          
          {results.aiService && (
            <div className="mt-2">
              <div>
                Status: <span className={results.aiService.success ? "text-green-600" : "text-red-600"}>
                  {results.aiService.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              {results.aiService.success && results.aiService.data && (
                <div className="text-sm">
                  Response received
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Payment Service</h3>
          <button 
            onClick={testPaymentService}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading.paymentService}
          >
            {loading.paymentService ? 'Loading...' : 'Test Payment Service'}
          </button>
          
          {error.paymentService && (
            <div className="text-red-500 text-sm mt-2">
              Error: {error.paymentService}
            </div>
          )}
          
          {results.paymentService && (
            <div className="mt-2">
              <div>
                Status: <span className={results.paymentService.success ? "text-green-600" : "text-red-600"}>
                  {results.paymentService.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              {results.paymentService.success && results.paymentService.data && (
                <div className="text-sm">
                  Response received
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Response Details</h3>
        <pre className="text-xs overflow-auto max-h-60 p-2 bg-gray-900 text-green-400 rounded">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>Note: Failed tests for AI and Payment services are expected if those backend services are not yet implemented.</p>
      </div>
    </div>
  );
};

export default APITest; 