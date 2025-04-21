import { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, HStack, Badge, Spinner, useToast } from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';
import { 
  userService, 
  cvService, 
  exportService, 
  aiService,
  paymentService 
} from '../api';
import { authHelper } from '../lib/supabase';

const ServiceStatus = ({ name, status, message }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'green';
      case 'unhealthy':
        return 'red';
      default:
        return 'yellow';
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" width="100%">
      <HStack spacing={4}>
        <Box>
          {status.toLowerCase() === 'healthy' ? (
            <CheckCircleIcon color="green.500" />
          ) : status.toLowerCase() === 'unhealthy' ? (
            <WarningIcon color="red.500" />
          ) : (
            <InfoIcon color="yellow.500" />
          )}
        </Box>
        <VStack align="start" spacing={1} flex={1}>
          <HStack justify="space-between" width="100%">
            <Heading size="sm">{name}</Heading>
            <Badge colorScheme={getStatusColor(status)}>{status}</Badge>
          </HStack>
          <Text fontSize="sm" color="gray.600">{message}</Text>
        </VStack>
      </HStack>
    </Box>
  );
};

const APITest = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/healthcheck');
        const data = await response.json();
        setHealthStatus(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        toast({
          title: 'Error checking health status',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    // Poll health status every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [toast]);

  if (loading) {
    return (
      <Box p={8} display="flex" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">System Health Status</Heading>
        
        {error ? (
          <Box p={4} bg="red.50" borderRadius="lg">
            <Text color="red.500">Error: {error}</Text>
          </Box>
        ) : (
          <>
            <Box p={4} bg="gray.50" borderRadius="lg">
              <VStack align="start" spacing={2}>
                <Text><strong>Status:</strong> {healthStatus?.status}</Text>
                <Text><strong>Version:</strong> {healthStatus?.version}</Text>
                <Text><strong>Last Updated:</strong> {new Date(healthStatus?.timestamp).toLocaleString()}</Text>
              </VStack>
            </Box>

            <VStack spacing={4} align="stretch">
              <Heading size="md">Services</Heading>
              {healthStatus?.services && Object.entries(healthStatus.services).map(([name, service]) => (
                <ServiceStatus
                  key={name}
                  name={name}
                  status={service.status}
                  message={service.message}
                />
              ))}
            </VStack>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default APITest; 