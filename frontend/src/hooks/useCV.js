import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { cvService, utils } from '../api';

/**
 * Custom hook for CV operations
 * @returns {Object} CV operations and state
 */
const useCV = () => {
  const [templates, setTemplates] = useState([]);
  const [cvs, setCVs] = useState([]);
  const [currentCV, setCurrentCV] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  
  /**
   * Fetch all CV templates
   */
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cvService.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(utils.handleApiError(err, 'Failed to load CV templates'));
      toast({
        title: 'Error',
        description: 'Failed to load CV templates',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Fetch all user's CVs
   */
  const fetchUserCVs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cvService.getCVs();
      setCVs(data);
    } catch (err) {
      setError(utils.handleApiError(err, 'Failed to load your CVs'));
      toast({
        title: 'Error',
        description: 'Failed to load your CVs',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Fetch a single CV by ID
   */
  const fetchCV = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await cvService.getCV(id);
      setCurrentCV(data);
      return data;
    } catch (err) {
      setError(utils.handleApiError(err, 'Failed to load CV'));
      toast({
        title: 'Error',
        description: 'Failed to load CV',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Create a new CV
   */
  const createCV = useCallback(async (cvData) => {
    try {
      setLoading(true);
      setError(null);
      const data = await cvService.createCV(cvData);
      setCVs((prevCVs) => [...prevCVs, data]);
      toast({
        title: 'Success',
        description: 'CV created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      return data;
    } catch (err) {
      setError(utils.handleApiError(err, 'Failed to create CV'));
      toast({
        title: 'Error',
        description: 'Failed to create CV',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Update an existing CV
   */
  const updateCV = useCallback(async (id, cvData) => {
    try {
      setLoading(true);
      setError(null);
      const data = await cvService.updateCV(id, cvData);
      setCVs((prevCVs) => prevCVs.map(cv => cv.id === id ? data : cv));
      if (currentCV?.id === id) {
        setCurrentCV(data);
      }
      toast({
        title: 'Success',
        description: 'CV updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      return data;
    } catch (err) {
      setError(utils.handleApiError(err, 'Failed to update CV'));
      toast({
        title: 'Error',
        description: 'Failed to update CV',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, currentCV]);
  
  /**
   * Delete a CV
   */
  const deleteCV = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await cvService.deleteCV(id);
      setCVs((prevCVs) => prevCVs.filter(cv => cv.id !== id));
      if (currentCV?.id === id) {
        setCurrentCV(null);
      }
      toast({
        title: 'Success',
        description: 'CV deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      return true;
    } catch (err) {
      setError(utils.handleApiError(err, 'Failed to delete CV'));
      toast({
        title: 'Error',
        description: 'Failed to delete CV',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, currentCV]);
  
  /**
   * Export a CV to a specific format
   */
  const exportCV = useCallback(async (id, format) => {
    try {
      setLoading(true);
      setError(null);
      const blob = await cvService.exportCV(id, format);
      
      // Get CV name for the file
      let fileName = `CV_${id}.${format}`;
      if (currentCV?.id === id) {
        const name = `${currentCV.personal?.firstName || 'User'}_${currentCV.personal?.lastName || 'CV'}`;
        fileName = `${name}.${format}`;
      }
      
      // Create downloadable file
      utils.downloadFile(blob, fileName);
      
      toast({
        title: 'Success',
        description: `CV exported as ${format.toUpperCase()} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      return true;
    } catch (err) {
      setError(utils.handleApiError(err, `Failed to export CV as ${format.toUpperCase()}`));
      toast({
        title: 'Error',
        description: `Failed to export CV as ${format.toUpperCase()}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, currentCV]);
  
  /**
   * Get a shared CV (public access)
   */
  const getSharedCV = useCallback(async (sharedId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await cvService.getSharedCV(sharedId);
      return data;
    } catch (err) {
      setError(utils.handleApiError(err, 'Failed to load shared CV'));
      toast({
        title: 'Error',
        description: 'Failed to load shared CV',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Generate a share link for a CV
   */
  const shareCV = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await cvService.shareCV(id);
      toast({
        title: 'Success',
        description: 'Share link generated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      return data.shareLink || data.shareUrl || data.url;
    } catch (err) {
      setError(utils.handleApiError(err, 'Failed to generate share link'));
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  return {
    templates,
    cvs,
    currentCV,
    loading,
    error,
    fetchTemplates,
    fetchUserCVs,
    fetchCV,
    createCV,
    updateCV,
    deleteCV,
    exportCV,
    getSharedCV,
    shareCV
  };
};

export default useCV; 