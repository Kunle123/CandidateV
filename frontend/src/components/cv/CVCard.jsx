import React from 'react';
import { Card, CardBody, CardFooter, Stack, Heading, Text, Flex, Button } from '@chakra-ui/react';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

const CVCard = ({ cv, onView, onEdit, onDelete, children }) => {
  return (
    <Card mb={4} shadow="md" borderRadius="lg">
      <CardBody>
        <Stack spacing={3}>
          <Heading size="md">{cv.title}</Heading>
          <Text>Last modified: {new Date(cv.last_modified).toLocaleDateString()}</Text>
          <Text noOfLines={2}>{cv.description || "No description provided."}</Text>
        </Stack>
      </CardBody>
      <CardFooter>
        <Flex gap={2} wrap="wrap">
          {children}
          <Button leftIcon={<FaEye />} colorScheme="teal" variant="outline" size="sm" onClick={() => onView(cv.id)}>
            View
          </Button>
          <Button leftIcon={<FaEdit />} colorScheme="blue" variant="outline" size="sm" onClick={() => onEdit(cv.id)}>
            Edit
          </Button>
          <Button leftIcon={<FaTrash />} colorScheme="red" variant="outline" size="sm" onClick={() => onDelete(cv.id)}>
            Delete
          </Button>
        </Flex>
      </CardFooter>
    </Card>
  );
};

export default CVCard; 