import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Spinner, Flex } from '@chakra-ui/react';

/**
 * Authentication wrapper component that handles auth initialization
 * and ensures proper token setup
 */
const AuthWrapper = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Flex>
    );
  }

  return <>{children}</>;
};

export default AuthWrapper; 