/**
 * Mock data for development and demo mode
 * This provides sample data when running in demo mode to avoid backend dependencies
 */

const mockData = {
  // CV templates
  cv_templates: [
    {
      id: 1,
      name: 'Professional',
      thumbnail: 'https://via.placeholder.com/150?text=Professional',
      description: 'A clean, professional template suitable for most industries',
      sections: ['header', 'summary', 'experience', 'education', 'skills']
    },
    {
      id: 2,
      name: 'Creative',
      thumbnail: 'https://via.placeholder.com/150?text=Creative',
      description: 'A modern, creative template with bold design elements',
      sections: ['header', 'summary', 'experience', 'education', 'skills', 'projects']
    },
    {
      id: 3,
      name: 'Academic',
      thumbnail: 'https://via.placeholder.com/150?text=Academic',
      description: 'Suitable for academic and research positions',
      sections: ['header', 'research', 'publications', 'education', 'teaching', 'awards']
    }
  ],

  // User CVs
  cv: [
    {
      id: 1,
      name: 'My Software Engineer CV',
      user_id: 'demo-user-id',
      template_id: 1,
      created_at: '2023-07-12T08:30:00Z',
      updated_at: '2023-08-25T14:45:00Z',
      content: {
        header: {
          name: 'John Developer',
          title: 'Senior Software Engineer',
          email: 'john@example.com',
          phone: '(123) 456-7890',
          location: 'San Francisco, CA',
          linkedin: 'linkedin.com/in/johndeveloper'
        },
        summary: 'Experienced software engineer with 8+ years developing scalable applications using Node.js, React, and Python. Passionate about clean code and elegant solutions.',
        experience: [
          {
            company: 'Tech Giants Inc.',
            position: 'Senior Software Engineer',
            startDate: '2020-01',
            endDate: 'Present',
            description: 'Lead developer for the customer-facing API platform. Improved response times by 35% and implemented CI/CD pipeline.',
            achievements: [
              'Migrated monolith to microservices architecture',
              'Mentored junior developers',
              'Reduced error rates by 40%'
            ]
          },
          {
            company: 'Startup Ventures',
            position: 'Full Stack Developer',
            startDate: '2016-03',
            endDate: '2019-12',
            description: 'Developed and maintained e-commerce platform serving 10k+ daily users',
            achievements: [
              'Implemented payment processing system',
              'Created responsive mobile UI',
              'Optimized database queries for performance'
            ]
          }
        ],
        education: [
          {
            institution: 'University of Technology',
            degree: 'B.S. Computer Science',
            date: '2016',
            gpa: '3.8',
            achievements: ['Graduated with honors', 'Senior project: AI-based recommendation engine']
          }
        ],
        skills: [
          { name: 'JavaScript', level: 'Expert' },
          { name: 'React', level: 'Expert' },
          { name: 'Node.js', level: 'Expert' },
          { name: 'Python', level: 'Advanced' },
          { name: 'AWS', level: 'Advanced' },
          { name: 'Docker', level: 'Intermediate' },
          { name: 'SQL', level: 'Advanced' }
        ]
      }
    },
    {
      id: 2,
      name: 'Marketing Manager Resume',
      user_id: 'demo-user-id',
      template_id: 2,
      created_at: '2023-09-05T10:15:00Z',
      updated_at: '2023-09-10T16:30:00Z',
      content: {
        header: {
          name: 'Sarah Marketer',
          title: 'Digital Marketing Manager',
          email: 'sarah@example.com',
          phone: '(987) 654-3210',
          location: 'New York, NY',
          linkedin: 'linkedin.com/in/sarahmarketer'
        },
        summary: 'Results-driven marketing professional with expertise in digital campaigns, content strategy, and brand development. Proven track record of increasing conversions and building audience engagement.',
        experience: [
          {
            company: 'Brand Leaders Co.',
            position: 'Digital Marketing Manager',
            startDate: '2019-06',
            endDate: 'Present',
            description: 'Manage all aspects of digital marketing strategy for B2B SaaS company.',
            achievements: [
              'Increased conversion rates by 25% through A/B testing',
              'Grew email list from 5k to 25k subscribers',
              'Managed $500k annual advertising budget'
            ]
          },
          {
            company: 'Marketing Agency Inc.',
            position: 'Marketing Specialist',
            startDate: '2017-01',
            endDate: '2019-05',
            description: 'Executed marketing campaigns for various clients across industries',
            achievements: [
              'Created social media strategy for major retail brand',
              'Wrote content that achieved 200% higher engagement',
              'Managed PPC campaigns with 3.5x ROI'
            ]
          }
        ],
        education: [
          {
            institution: 'Business University',
            degree: 'B.A. Marketing',
            date: '2017',
            gpa: '3.7',
            achievements: ['Marketing Club President', 'Internship with Fortune 500 company']
          }
        ],
        skills: [
          { name: 'SEO/SEM', level: 'Expert' },
          { name: 'Content Marketing', level: 'Expert' },
          { name: 'Social Media', level: 'Expert' },
          { name: 'Google Analytics', level: 'Advanced' },
          { name: 'Adobe Creative Suite', level: 'Intermediate' },
          { name: 'Email Marketing', level: 'Advanced' },
          { name: 'Copywriting', level: 'Advanced' }
        ]
      }
    }
  ],

  // Export formats
  export_formats: [
    { id: 'pdf', name: 'PDF', icon: 'file-pdf' },
    { id: 'docx', name: 'Word Document', icon: 'file-word' },
    { id: 'txt', name: 'Plain Text', icon: 'file-text' }
  ],

  // User profile
  user: {
    id: 'demo-user-id',
    name: 'Demo User',
    email: 'demo@candidatev.com',
    profile_picture: 'https://via.placeholder.com/150',
    role: 'user',
    premium: false,
    created_at: '2023-05-10T08:00:00Z'
  },

  // Sample job analysis data
  job_analysis: {
    match_score: 78,
    top_skills_matched: [
      { name: 'JavaScript', count: 5 },
      { name: 'React', count: 4 },
      { name: 'API Development', count: 3 }
    ],
    missing_skills: [
      { name: 'GraphQL', importance: 'high' },
      { name: 'TypeScript', importance: 'medium' },
      { name: 'Kubernetes', importance: 'low' }
    ],
    recommendations: [
      'Add more details about your React experience',
      'Include examples of API work in your job descriptions',
      'Add a section highlighting your GraphQL knowledge if applicable'
    ]
  }
};

export default mockData; 