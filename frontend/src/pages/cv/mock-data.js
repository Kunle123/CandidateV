/**
 * Mock CV templates for development purposes
 */
export const mockTemplates = [
  {
    id: 'template1',
    name: 'Professional',
    description: 'A clean and professional template suitable for most industries',
    thumbnail: 'https://via.placeholder.com/300x200?text=Professional',
    is_premium: false,
    categories: ['all', 'professional', 'minimal'],
    color_schemes: ['blue', 'gray', 'teal'],
  },
  {
    id: 'template2',
    name: 'Modern',
    description: 'A modern and bold template with standout sections and creative design',
    thumbnail: 'https://via.placeholder.com/300x200?text=Modern',
    is_premium: false,
    categories: ['all', 'creative', 'modern'],
    color_schemes: ['purple', 'pink', 'indigo'],
  },
  {
    id: 'template3',
    name: 'Executive',
    description: 'A sophisticated template for senior positions and executive roles',
    thumbnail: 'https://via.placeholder.com/300x200?text=Executive',
    is_premium: true,
    categories: ['all', 'professional', 'executive'],
    color_schemes: ['blue', 'gray', 'red'],
  },
  {
    id: 'template4',
    name: 'Creative',
    description: 'A unique template for creative industry professionals',
    thumbnail: 'https://via.placeholder.com/300x200?text=Creative',
    is_premium: true,
    categories: ['all', 'creative', 'modern'],
    color_schemes: ['orange', 'green', 'yellow'],
  },
  {
    id: 'template5',
    name: 'Minimalist',
    description: 'A simple, straightforward template that focuses on content',
    thumbnail: 'https://via.placeholder.com/300x200?text=Minimalist',
    is_premium: false,
    categories: ['all', 'minimal', 'professional'],
    color_schemes: ['gray', 'black', 'white'],
  },
  {
    id: 'template6',
    name: 'Tech',
    description: 'Designed specifically for IT professionals and developers',
    thumbnail: 'https://via.placeholder.com/300x200?text=Tech',
    is_premium: true,
    categories: ['all', 'tech', 'modern'],
    color_schemes: ['blue', 'teal', 'cyan'],
  },
];

/**
 * Mock export formats
 */
export const mockExportFormats = [
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Standard document format accepted by most employers',
    icon: 'pdf',
  },
  {
    id: 'docx',
    name: 'Word Document',
    description: 'Editable format compatible with Microsoft Word',
    icon: 'word',
  },
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'Simple text format for ATS systems',
    icon: 'text',
  },
];

/**
 * Sample CV data for development
 */
export const sampleCV = {
  id: 'sample-cv-1',
  templateId: 'template1',
  personal: {
    firstName: 'John',
    lastName: 'Doe',
    title: 'Senior Software Engineer',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    summary: 'Experienced software engineer with 8+ years of experience in full-stack development. Specialized in React, Node.js, and cloud architecture.',
  },
  experience: [
    {
      company: 'Tech Innovations Inc.',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2020-03',
      endDate: '',
      current: true,
      description: 'Lead developer for the company\'s main product. Implemented new features, refactored legacy code, and mentored junior developers. Improved application performance by 40%.',
    },
    {
      company: 'WebSolutions Ltd.',
      position: 'Software Engineer',
      location: 'Boston, MA',
      startDate: '2017-06',
      endDate: '2020-02',
      current: false,
      description: 'Developed and maintained multiple client web applications. Collaborated with design and product teams to deliver high-quality solutions.',
    },
    {
      company: 'StartupXYZ',
      position: 'Junior Developer',
      location: 'New York, NY',
      startDate: '2015-01',
      endDate: '2017-05',
      current: false,
      description: 'Assisted in the development of web applications. Learned various technologies and best practices for software development.',
    },
  ],
  education: [
    {
      institution: 'Massachusetts Institute of Technology',
      degree: 'Master\'s Degree',
      field: 'Computer Science',
      startDate: '2013-09',
      endDate: '2015-05',
      description: 'Specialized in artificial intelligence and machine learning. GPA: 3.9/4.0.',
    },
    {
      institution: 'University of California, Berkeley',
      degree: 'Bachelor\'s Degree',
      field: 'Computer Science',
      startDate: '2009-09',
      endDate: '2013-05',
      description: 'Dean\'s List, Computer Science Student Association president. GPA: 3.8/4.0.',
    },
  ],
  skills: [
    { name: 'JavaScript', level: 'Expert' },
    { name: 'React', level: 'Expert' },
    { name: 'Node.js', level: 'Advanced' },
    { name: 'TypeScript', level: 'Advanced' },
    { name: 'AWS', level: 'Intermediate' },
    { name: 'Python', level: 'Intermediate' },
    { name: 'Docker', level: 'Intermediate' },
    { name: 'SQL', level: 'Advanced' },
    { name: 'GraphQL', level: 'Intermediate' },
    { name: 'Git', level: 'Advanced' },
  ],
  certifications: [
    { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', date: '2022-02' },
    { name: 'Google Cloud Professional Developer', issuer: 'Google', date: '2021-05' },
    { name: 'MongoDB Certified Developer', issuer: 'MongoDB', date: '2020-11' },
  ],
  languages: [
    { name: 'English', level: 'Native' },
    { name: 'Spanish', level: 'Intermediate' },
    { name: 'French', level: 'Basic' },
  ],
};

/**
 * Mock user CVs
 */
export const mockUserCVs = [
  {
    id: 'cv-1',
    name: 'Software Developer CV',
    templateId: 'template1',
    lastUpdated: '2022-11-15T12:30:45Z',
    personal: { firstName: 'John', lastName: 'Doe', title: 'Software Developer' },
  },
  {
    id: 'cv-2',
    name: 'Product Manager CV',
    templateId: 'template3',
    lastUpdated: '2022-10-05T09:15:30Z',
    personal: { firstName: 'John', lastName: 'Doe', title: 'Product Manager' },
  },
  {
    id: 'cv-3',
    name: 'UX Designer CV',
    templateId: 'template4',
    lastUpdated: '2022-09-18T14:45:12Z',
    personal: { firstName: 'John', lastName: 'Doe', title: 'UX Designer' },
  },
]; 