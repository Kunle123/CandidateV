{isLoggedIn && (
  <PopoverTrigger>
    <Button rightIcon={<ChevronDownIcon />} variant="ghost">
      CVs
    </Button>
  </PopoverTrigger>
)}
{isLoggedIn && (
  <PopoverContent>
    <PopoverArrow />
    <PopoverCloseButton />
    <PopoverHeader>CV Management</PopoverHeader>
    <PopoverBody>
      <VStack align="start">
        <Button
          as={Link}
          to="/cv"
          variant="ghost"
          w="100%"
          justifyContent="flex-start"
          leftIcon={<FaFileAlt />}
        >
          My CVs
        </Button>
        <Button
          as={Link}
          to="/cv/optimize"
          variant="ghost"
          w="100%"
          justifyContent="flex-start"
          leftIcon={<FaMagic />}
        >
          Optimize CV
        </Button>
      </VStack>
    </PopoverBody>
  </PopoverContent>
)} 