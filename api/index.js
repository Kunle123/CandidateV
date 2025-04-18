require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

// Environment variables with explicit defaults
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'https://candidatev-auth-service.up.railway.app',
  user: process.env.USER_SERVICE_URL || 'https://candidatev-user-service.up.railway.app',
  cv: process.env.CV_SERVICE_URL || 'https://candidatev-cv-service.up.railway.app',
  export: process.env.EXPORT_SERVICE_URL || 'https://candidatev-export-service.up.railway.app',
  ai: process.env.AI_SERVICE_URL || 'https://ai-service-production.up.railway.app',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://candidatev-payment-service.up.railway.app'
};

// CORS configuration
const corsOptions = {
  origin: ['https://candidate-v.vercel.app', 'http://localhost:3000', 'http://localhost:5173', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Apply essential middleware
app.use(helmet({ 
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Add CORS headers to all responses
app.use((req, res, next) => {
  // Allow requests from any origin in development
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(SERVICE_URLS).map(name => ({
      name,
      url: SERVICE_URLS[name]
    }))
  });
});

// Mock auth registration endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Received registration request:', req.body);
  
  // Check if required fields are present
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      status: 'error',
      message: 'Email and password are required',
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock successful registration
  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    user: {
      id: `user-${Date.now()}`,
      email: req.body.email,
      created_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Mock auth login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Received login request:');
  console.log('Body:', JSON.stringify(req.body));
  console.log('Headers:', JSON.stringify(req.headers));
  
  try {
    // OAuth style form data handling
    let email = req.body.email;
    let password = req.body.password;
    
    // Handle OAuth2PasswordRequestForm format (username instead of email)
    if (!email && req.body.username) {
      email = req.body.username;
      console.log('Using username field as email:', email);
    }
    
    // Handle URL-encoded form data
    if (!email && req.body.toString().includes('username=')) {
      try {
        const formData = new URLSearchParams(req.body.toString());
        email = formData.get('username');
        password = formData.get('password');
        console.log('Parsed form data:', { email, password: '********' });
      } catch (e) {
        console.error('Failed to parse URL-encoded form data:', e);
      }
    }
    
    // For string body
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
        console.log('Parsed string body:', JSON.stringify(req.body));
        email = req.body.email || req.body.username;
        password = req.body.password;
      } catch (e) {
        console.error('Failed to parse string body:', e);
      }
    }
    
    // For form data or URL encoded
    if (req.body && req.body.data) {
      try {
        const parsedData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
        console.log('Found data field:', JSON.stringify(parsedData));
        
        // Use the parsed data
        if (parsedData.email) email = parsedData.email;
        if (parsedData.username) email = parsedData.username;
        if (parsedData.password) password = parsedData.password;
      } catch (e) {
        console.error('Failed to parse data field:', e);
      }
    }
    
    // Check if required fields are present
    if (!email || !password) {
      console.error('Missing required fields. Body:', JSON.stringify(req.body));
      return res.status(400).json({
        status: 'error',
        message: 'Email/username and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Mock successful login - return in FastAPI/OAuth format
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      access_token: `mock-jwt-token-${Date.now()}`,
      refresh_token: `mock-refresh-token-${Date.now()}`,
      token_type: 'bearer',
      user: {
        id: `user-${Date.now()}`,
        email: email,
        created_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in login endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to see request structure
app.post('/api/debug/echo', (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Request echoed',
      body: req.body,
      headers: req.headers,
      method: req.method,
      path: req.path,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error echoing request',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mock AI job matching endpoint
app.post('/api/ai/job-match/analyze', async (req, res) => {
  console.log('Received job matching request:', req.body);
  
  try {
    // Extract CV ID and job description from request
    const { cv_id, job_description, detailed } = req.body;
    
    if (!cv_id || !job_description) {
      return res.status(400).json({
        status: 'error',
        message: 'CV ID and job description are required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Analyzing job match for CV ${cv_id}`);
    
    // First, get the CV content from our API
    let cvContent;
    try {
      // Get CV content from CV service or mock endpoint
      const cvResponse = await axios.get(`http://localhost:${PORT}/api/cv/${cv_id}`);
      if (cvResponse.data && cvResponse.data.data) {
        // Convert CV data to string format for analysis
        cvContent = JSON.stringify(cvResponse.data.data);
      } else {
        throw new Error('CV data not found');
      }
    } catch (error) {
      console.error('Error fetching CV data:', error);
      cvContent = `This is a mock CV with ID ${cv_id} for testing purposes.`;
    }
    
    let result;
    // If OPENAI_API_KEY is configured, use OpenAI for analysis
    if (OPENAI_API_KEY) {
      console.log('Using OpenAI for job match analysis');
      result = await analyzeCV(cvContent, job_description);
      
      // Add the analysis timestamp and CV ID to the result
      result.analysis_timestamp = new Date().toISOString();
      result.cv_id = cv_id;
    } else {
      console.log('OpenAI API Key not configured, using mock implementation');
      // Use the existing mock implementation as fallback
      // Generate a more realistic match score based on job description and CV ID
      let calculatedScore;
      
      // Simple algorithm to generate a score that isn't always the same
      if (job_description) {
        // Use job description length and content to influence score
        const jobLength = job_description.length;
        const hasKeyword1 = job_description.toLowerCase().includes('project') ? 10 : 0;
        const hasKeyword2 = job_description.toLowerCase().includes('management') ? 8 : 0;
        const hasKeyword3 = job_description.toLowerCase().includes('software') ? 15 : 0;
        const hasKeyword4 = job_description.toLowerCase().includes('development') ? 12 : 0;
        
        // Generate a more variable score
        calculatedScore = Math.min(95, Math.max(65, 
          75 + hasKeyword1 + hasKeyword2 + hasKeyword3 + hasKeyword4 + 
          (jobLength % 20) - (jobLength % 7)
        ));
      } else {
        calculatedScore = 78.5; // Default if no job description
      }
      
      console.log(`Generated calculated match score: ${calculatedScore.toFixed(1)}%`);
      
      // Create strengths and weaknesses based on job description
      const strengths = [];
      const weaknesses = [];
      const keywords_found = [];
      const keywords_missing = [];
      
      // Extract potential skills from job description
      const skillKeywords = [
        'project management', 'agile', 'scrum', 'kanban', 'waterfall',
        'javascript', 'python', 'react', 'node', 'java', 'c#', '.net',
        'cloud', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
        'leadership', 'communication', 'teamwork', 'problem-solving'
      ];
      
      // Check for skills in job description
      skillKeywords.forEach(skill => {
        if (job_description && job_description.toLowerCase().includes(skill)) {
          // 70% chance to add as a strength
          if (Math.random() > 0.3) {
            strengths.push(`Good experience with ${skill}`);
            keywords_found.push(skill);
          } else {
            weaknesses.push(`Consider highlighting more ${skill} experience`);
            keywords_missing.push(skill);
          }
        }
      });
      
      // Add some default strengths and weaknesses if we don't have enough
      if (strengths.length < 3) {
        strengths.push("Strong professional experience");
        strengths.push("Relevant educational background");
        strengths.push("Good communication skills highlighted");
      }
      
      if (weaknesses.length < 2) {
        weaknesses.push("Consider adding more specific achievements with metrics");
        weaknesses.push("Some industry keywords might be missing from your CV");
      }
      
      // Create improved mock job match analysis results with calculated score
      result = {
        match_score: parseFloat(calculatedScore.toFixed(1)),
        cv_id: cv_id,
        overview: "Your CV has been analyzed against the job description. Here's a summary of how well your CV matches the requirements.",
        strengths: strengths.slice(0, 5), // Limit to 5 strengths
        weaknesses: weaknesses.slice(0, 4), // Limit to 4 weaknesses
        keywords_found: keywords_found.slice(0, 6), // Limit to 6 keywords
        keywords_missing: keywords_missing.slice(0, 4), // Limit to 4 keywords
        analysis_timestamp: new Date().toISOString()
      };
    }
    
    console.log('Returning job match analysis with structure:', result);
    
    // Return the analysis result
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in job matching endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mock AI optimization endpoint
app.post('/api/ai/optimize', async (req, res) => {
  console.log('Received CV optimization request:', req.body);
  
  try {
    // Extract CV ID, targets, and job description from request
    const { cv_id, targets, job_description, user_comments } = req.body;
    
    if (!cv_id || !targets || targets.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'CV ID and optimization targets are required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Optimizing CV ${cv_id} with ${targets.length} targets`);
    
    let optimized_sections;
    
    // If OpenAI API key is configured, use it for optimization
    if (OPENAI_API_KEY) {
      console.log('Using OpenAI for CV optimization');
      
      // Get the response from OpenAI
      const optimizationResult = await optimizeCV(targets, job_description);
      
      // Use the optimized sections from the OpenAI response
      optimized_sections = optimizationResult.optimized_sections;
    } else {
      console.log('OpenAI API Key not configured, using mock implementation');
      // Create optimized sections based on the targets
      optimized_sections = targets.map(target => {
        // Extract the original content and section type
        const original_content = target.content || '';
        const sectionType = target.section || 'unknown';
        
        // Use job description keywords to improve the section if available
        let keywords = [];
        if (job_description) {
          // Extract potential keywords from job description
          const keywordMatches = job_description.match(/\b\w{5,}\b/g) || [];
          keywords = [...new Set(keywordMatches)].slice(0, 10); // Get unique keywords
        }
        
        // Generate an optimized version based on section type
        let optimized_content = '';
        let improvements = [];
        
        // Different optimization strategies based on section type
        if (sectionType.includes('summary')) {
          // For summary sections, make it more concise and professional
          optimized_content = `${generateProfessionalSummary(original_content, job_description, keywords)}`;
          improvements = [
            "Made summary more focused on specific achievements",
            "Aligned with job requirements",
            "Improved professional tone"
          ];
        } 
        else if (sectionType.includes('experience')) {
          // For experience sections, add achievements and metrics
          optimized_content = `${generateImprovedExperience(original_content, job_description, keywords)}`;
          improvements = [
            "Added quantifiable achievements",
            "Highlighted relevant skills",
            "Used stronger action verbs"
          ];
        }
        else if (sectionType.includes('skills')) {
          // For skills, prioritize ones mentioned in job description
          optimized_content = `${generateRelevantSkills(original_content, job_description, keywords)}`;
          improvements = [
            "Prioritized skills mentioned in job description",
            "Added relevant technical competencies",
            "Removed less relevant skills"
          ];
        }
        else {
          // Generic optimization for other sections
          optimized_content = `${original_content} ${generateGenericImprovement(original_content, job_description)}`;
          improvements = [
            "Improved clarity and structure",
            "Enhanced professional language",
            "Better aligned with industry standards"
          ];
        }
        
        return {
          section: target.section,
          original_content: original_content,
          optimized_content: optimized_content,
          improvements: improvements
        };
      });
    }
    
    // Return optimization results
    res.status(200).json({
      status: 'success',
      message: 'CV optimization completed successfully',
      cv_id: cv_id,
      optimized_sections: optimized_sections,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in CV optimization endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions for CV optimization

// Generate an improved professional summary
function generateProfessionalSummary(originalContent, jobDescription, keywords) {
  const buzzwords = [
    "results-driven", "strategic", "innovative", "detail-oriented", 
    "collaborative", "analytical", "versatile", "proactive"
  ];
  
  // Randomly select buzzwords
  const selectedBuzzwords = buzzwords.sort(() => 0.5 - Math.random()).slice(0, 2);
  
  // Basic structure for a professional summary
  let summary = `${selectedBuzzwords[0]} professional with extensive experience in `;
  
  // Add industry keywords if job description is available
  if (jobDescription) {
    // Try to extract industry/role from job description
    const industries = [
      "software development", "project management", "data analysis", 
      "marketing", "finance", "healthcare", "education", "engineering"
    ];
    
    // Find which industries are mentioned in the job description
    const matchedIndustries = industries.filter(industry => 
      jobDescription.toLowerCase().includes(industry)
    );
    
    if (matchedIndustries.length > 0) {
      summary += `${matchedIndustries[0]}`;
    } else {
      // Default if no match found
      summary += "the industry";
    }
  } else {
    summary += "the industry";
  }
  
  // Add achievements
  summary += `. ${selectedBuzzwords[1]} approach to problem-solving with demonstrated success in delivering high-quality results. `;
  
  // Add skills based on keywords if available
  if (keywords.length > 0) {
    const selectedKeywords = keywords.sort(() => 0.5 - Math.random()).slice(0, 3);
    summary += `Skilled in ${selectedKeywords.join(', ')}, with a passion for continuous improvement and professional growth.`;
  } else {
    summary += "Committed to excellence and achieving optimal outcomes through collaboration and innovation.";
  }
  
  return summary;
}

// Generate improved experience description
function generateImprovedExperience(originalContent, jobDescription, keywords) {
  // Action verbs for experience descriptions
  const actionVerbs = [
    "Spearheaded", "Implemented", "Orchestrated", "Transformed", 
    "Developed", "Managed", "Led", "Enhanced", "Streamlined", "Delivered"
  ];
  
  // Randomly select action verbs
  const selectedVerbs = actionVerbs.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  // Start with a strong action verb
  let experience = `${selectedVerbs[0]} `;
  
  // Add a project/initiative description
  if (originalContent.length > 0) {
    // Use parts of the original content
    const sentences = originalContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      // Take the first sentence and improve it
      const firstSentence = sentences[0].trim();
      experience += firstSentence.charAt(0).toLowerCase() + firstSentence.slice(1);
    } else {
      experience += "various initiatives and projects with significant business impact";
    }
  } else {
    experience += "various initiatives and projects with significant business impact";
  }
  
  experience += `. ${selectedVerbs[1]} cross-functional team collaboration resulting in `;
  
  // Add metrics
  const metrics = [
    "20% increase in efficiency", 
    "30% reduction in processing time",
    "$500K cost savings annually", 
    "15% improvement in customer satisfaction"
  ];
  
  experience += `${metrics[Math.floor(Math.random() * metrics.length)]}. `;
  
  // Add skills based on keywords if available
  if (keywords.length > 0) {
    const selectedKeywords = keywords.sort(() => 0.5 - Math.random()).slice(0, 2);
    experience += `${selectedVerbs[2]} implementation of ${selectedKeywords.join(' and ')} to optimize operational processes.`;
  } else {
    experience += `${selectedVerbs[2]} implementation of best practices to optimize operational processes.`;
  }
  
  return experience;
}

// Generate relevant skills
function generateRelevantSkills(originalContent, jobDescription, keywords) {
  // Common skills by category
  const skillCategories = {
    technical: ["Python", "JavaScript", "React", "Node.js", "AWS", "Azure", "SQL", "Docker", "Git"],
    soft: ["Communication", "Teamwork", "Leadership", "Problem-solving", "Time management"],
    management: ["Project Management", "Agile", "Scrum", "Kanban", "Risk Management", "Budgeting"]
  };
  
  // Start with original skills if available
  let skills = originalContent ? originalContent.split(/,|;/).map(s => s.trim()) : [];
  
  // Add job-relevant skills based on keywords
  if (keywords.length > 0) {
    // Map keywords to potential skills
    keywords.forEach(keyword => {
      // Check for technical terms
      if (skillCategories.technical.some(skill => 
        skill.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(skill.toLowerCase())
      )) {
        // Find the full skill name
        const matchedSkill = skillCategories.technical.find(skill => 
          skill.toLowerCase().includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(skill.toLowerCase())
        );
        if (matchedSkill && !skills.includes(matchedSkill)) {
          skills.push(matchedSkill);
        }
      }
      
      // Check for management terms
      if (skillCategories.management.some(skill => 
        skill.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(skill.toLowerCase())
      )) {
        const matchedSkill = skillCategories.management.find(skill => 
          skill.toLowerCase().includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(skill.toLowerCase())
        );
        if (matchedSkill && !skills.includes(matchedSkill)) {
          skills.push(matchedSkill);
        }
      }
    });
  }
  
  // Add some general skills if we don't have enough
  if (skills.length < 5) {
    const generalSkills = [
      ...skillCategories.soft,
      ...skillCategories.technical.slice(0, 3),
      ...skillCategories.management.slice(0, 2)
    ];
    
    // Add random skills until we have at least 5
    while (skills.length < 5) {
      const randomSkill = generalSkills[Math.floor(Math.random() * generalSkills.length)];
      if (!skills.includes(randomSkill)) {
        skills.push(randomSkill);
      }
    }
  }
  
  // Return as comma-separated list
  return skills.join(', ');
}

// Generate generic improvement for other sections
function generateGenericImprovement(originalContent, jobDescription) {
  // Professional enhancements
  const enhancements = [
    "with a focus on delivering measurable results",
    "emphasizing effective communication and collaboration",
    "demonstrating exceptional attention to detail",
    "showcasing adaptability in dynamic environments",
    "highlighting expertise in industry best practices"
  ];
  
  // Select a random enhancement
  return enhancements[Math.floor(Math.random() * enhancements.length)];
}

// Mock cover letter generation endpoint
app.post('/api/ai/cover-letter', async (req, res) => {
  console.log('Received cover letter generation request:', req.body);
  
  try {
    // Extract request parameters
    const { 
      cv_id, 
      job_description, 
      user_comments,
      company_name = 'the Company',
      recipient_name = 'Hiring Manager',
      position_title = 'the position'
    } = req.body;
    
    if (!cv_id || !job_description) {
      return res.status(400).json({
        status: 'error',
        message: 'CV ID and job description are required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Generating cover letter for CV ${cv_id} and position at ${company_name}`);
    
    // Get CV content
    let cvContent;
    try {
      // Get CV content from CV service or mock endpoint
      const cvResponse = await axios.get(`http://localhost:${PORT}/api/cv/${cv_id}`);
      if (cvResponse.data && cvResponse.data.data) {
        // Convert CV data to string format for analysis
        cvContent = JSON.stringify(cvResponse.data.data);
      } else {
        throw new Error('CV data not found');
      }
    } catch (error) {
      console.error('Error fetching CV data:', error);
      cvContent = `This is a mock CV with ID ${cv_id} for testing purposes.`;
    }
    
    let coverLetter, keyPoints, keywordsUsed;
    
    // If OpenAI API key is configured, use it for cover letter generation
    if (OPENAI_API_KEY) {
      console.log('Using OpenAI for cover letter generation');
      
      const aiResponse = await generateAICoverLetter(
        cvContent,
        job_description,
        company_name,
        recipient_name,
        position_title,
        user_comments
      );
      
      coverLetter = aiResponse.cover_letter;
      keyPoints = aiResponse.key_points;
      keywordsUsed = aiResponse.keywords_used;
    } else {
      console.log('OpenAI API Key not configured, using mock implementation');
      // Extract keywords from job description for mock implementation
      let keywords = [];
      if (job_description) {
        // Extract potential keywords from job description
        const keywordMatches = job_description.match(/\b\w{5,}\b/g) || [];
        keywords = [...new Set(keywordMatches)].slice(0, 12); // Get unique keywords
      }
      
      // Generate a tailored cover letter using mock implementation
      coverLetter = generateCoverLetter(
        job_description, 
        company_name, 
        recipient_name, 
        position_title, 
        keywords,
        user_comments
      );
      
      // Extract key points from the cover letter
      keyPoints = extractKeyPoints(coverLetter, keywords);
      
      // Extract keywords used in the cover letter
      keywordsUsed = extractKeywordsUsed(coverLetter, keywords);
    }
    
    // Return the generated cover letter
    res.status(200).json({
      status: 'success',
      message: 'Cover letter generated successfully',
      cv_id: cv_id,
      company_name: company_name,
      position_title: position_title,
      cover_letter: coverLetter,
      key_points: keyPoints,
      keywords_used: keywordsUsed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in cover letter generation endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Generate a cover letter
function generateCoverLetter(jobDescription, companyName, recipientName, positionTitle, keywords, userComments) {
  // Today's date in formal format
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Opening paragraph templates
  const openings = [
    `I am writing to express my interest in the ${positionTitle} position at ${companyName}. Having reviewed the job description, I am excited about the opportunity to contribute my skills and experience to your team.`,
    `With great enthusiasm, I am applying for the ${positionTitle} role with ${companyName}. After researching your organization and its achievements, I am confident that my background and skills align perfectly with what you are seeking.`,
    `I was excited to discover your opening for a ${positionTitle} at ${companyName}, as advertised. With my background and expertise, I believe I would be a valuable addition to your team.`
  ];
  
  // Body paragraph templates
  const bodies = [
    `My professional experience has equipped me with the skills necessary to excel in this role. I have consistently demonstrated my ability to [KEY_ACHIEVEMENT_1], [KEY_ACHIEVEMENT_2], and [KEY_ACHIEVEMENT_3].`,
    `Throughout my career, I have developed strong expertise in [SKILL_AREA_1] and [SKILL_AREA_2]. I take pride in my ability to [KEY_STRENGTH_1] while ensuring [KEY_STRENGTH_2].`,
    `My background includes extensive experience in [RELEVANT_FIELD], where I have successfully [ACCOMPLISHMENT_1]. This experience has prepared me to handle the challenges of the ${positionTitle} role effectively.`
  ];
  
  // Closing paragraph templates
  const closings = [
    `I am particularly drawn to ${companyName} because of your reputation for [COMPANY_STRENGTH]. I am excited about the prospect of bringing my [KEY_QUALIFICATION] to your team and contributing to your continued success.`,
    `What attracts me to ${companyName} is your commitment to [COMPANY_VALUE]. I am eager to apply my [KEY_SKILL] in an environment that values innovation and excellence.`,
    `${companyName}'s mission to [COMPANY_MISSION] resonates with my professional values. I would welcome the opportunity to contribute my expertise to help achieve your organizational goals.`
  ];
  
  // Sign-off templates
  const signoffs = [
    `Thank you for considering my application. I look forward to the opportunity to discuss how my background, skills, and experience would benefit ${companyName}.\n\nSincerely,\n\n[Your Name]`,
    `I would appreciate the opportunity to further discuss my qualifications and how I can contribute to your team. Thank you for your time and consideration.\n\nBest regards,\n\n[Your Name]`,
    `I am excited about the possibility of joining ${companyName} and would welcome the chance to speak with you further about how I can contribute to your team. Thank you for your consideration.\n\nKind regards,\n\n[Your Name]`
  ];
  
  // Randomly select one template from each section
  const opening = openings[Math.floor(Math.random() * openings.length)];
  const body = bodies[Math.floor(Math.random() * bodies.length)];
  const closing = closings[Math.floor(Math.random() * closings.length)];
  const signoff = signoffs[Math.floor(Math.random() * signoffs.length)];
  
  // Extract relevant information from job description
  let companyStrength = "industry leadership";
  let companyValue = "excellence and innovation";
  let companyMission = "deliver exceptional value";
  
  // Use common skill areas based on keywords or job description
  let skillArea1 = "team leadership";
  let skillArea2 = "project management";
  let relevantField = "the industry";
  
  // Try to extract company focus from job description
  if (jobDescription) {
    // Look for common industry keywords
    const industries = [
      "technology", "software", "healthcare", "finance", 
      "education", "manufacturing", "retail", "consulting"
    ];
    
    for (const industry of industries) {
      if (jobDescription.toLowerCase().includes(industry)) {
        relevantField = industry;
        break;
      }
    }
    
    // Look for common skill areas
    const skillAreas = [
      "project management", "software development", "data analysis",
      "customer service", "marketing", "sales", "operations", 
      "human resources", "finance", "research", "leadership"
    ];
    
    const foundSkills = skillAreas.filter(skill => 
      jobDescription.toLowerCase().includes(skill)
    );
    
    if (foundSkills.length >= 2) {
      skillArea1 = foundSkills[0];
      skillArea2 = foundSkills[1];
    } else if (foundSkills.length === 1) {
      skillArea1 = foundSkills[0];
    }
  }
  
  // Use keywords to fill in accomplishments
  let keyAchievement1 = "deliver high-quality results";
  let keyAchievement2 = "lead cross-functional teams";
  let keyAchievement3 = "implement innovative solutions";
  let keyStrength1 = "adaptability";
  let keyStrength2 = "attention to detail";
  let accomplishment1 = "reduced costs while improving quality";
  let keyQualification = "diverse skill set";
  let keySkill = "problem-solving abilities";
  
  if (keywords.length >= 7) {
    keyAchievement1 = `implement ${keywords[0]} solutions`;
    keyAchievement2 = `optimize ${keywords[1]} processes`;
    keyAchievement3 = `improve ${keywords[2]} outcomes`;
    keyStrength1 = keywords[3];
    keyStrength2 = keywords[4];
    keyQualification = keywords[5];
    keySkill = keywords[6];
  }
  
  // Replace placeholders in templates
  let modifiedBody = body
    .replace('[KEY_ACHIEVEMENT_1]', keyAchievement1)
    .replace('[KEY_ACHIEVEMENT_2]', keyAchievement2)
    .replace('[KEY_ACHIEVEMENT_3]', keyAchievement3)
    .replace('[SKILL_AREA_1]', skillArea1)
    .replace('[SKILL_AREA_2]', skillArea2)
    .replace('[KEY_STRENGTH_1]', keyStrength1)
    .replace('[KEY_STRENGTH_2]', keyStrength2)
    .replace('[RELEVANT_FIELD]', relevantField)
    .replace('[ACCOMPLISHMENT_1]', accomplishment1);
  
  let modifiedClosing = closing
    .replace('[COMPANY_STRENGTH]', companyStrength)
    .replace('[COMPANY_VALUE]', companyValue)
    .replace('[COMPANY_MISSION]', companyMission)
    .replace('[KEY_QUALIFICATION]', keyQualification)
    .replace('[KEY_SKILL]', keySkill);
  
  // Add user comments if provided
  let userCommentsParagraph = '';
  if (userComments && userComments.trim().length > 0) {
    userCommentsParagraph = `\n\n${userComments}\n\n`;
  } else {
    userCommentsParagraph = '\n\n';
  }
  
  // Assemble the cover letter
  const letterHeader = `${formattedDate}\n\n${recipientName}\n${companyName}\n\nRe: Application for ${positionTitle} Position\n\nDear ${recipientName},\n\n`;
  
  const letterBody = `${opening}\n\n${modifiedBody}\n\n${modifiedClosing}${userCommentsParagraph}${signoff}`;
  
  return letterHeader + letterBody;
}

// Extract key points from the cover letter
function extractKeyPoints(coverLetter, keywords) {
  // Default key points
  const defaultKeyPoints = [
    "Highlighted relevant experience in the industry",
    "Emphasized alignment with company values",
    "Demonstrated enthusiasm for the role",
    "Showcased problem-solving abilities",
    "Expressed interest in contributing to the company's success"
  ];
  
  // If we have keywords, try to create custom key points
  if (keywords.length >= 5) {
    return [
      `Emphasized experience with ${keywords[0]}`,
      `Highlighted expertise in ${keywords[1]}`,
      `Demonstrated skills in ${keywords[2]} and ${keywords[3]}`,
      `Connected background to company's focus on ${keywords[4]}`,
      "Conveyed enthusiasm and interest in the role"
    ];
  }
  
  return defaultKeyPoints;
}

// Extract keywords used in the cover letter
function extractKeywordsUsed(coverLetter, keywords) {
  // Default keywords
  const defaultKeywords = [
    "Professional", 
    "Experience",
    "Skills",
    "Leadership",
    "Innovation",
    "Communication",
    "Team work"
  ];
  
  // If we have actual keywords, return a subset of them
  if (keywords.length >= 7) {
    // Capitalize the first letter of each keyword
    return keywords.slice(0, 7).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  }
  
  return defaultKeywords;
}

// OpenAI Integration Functions
// Function to call OpenAI API
async function callOpenAI(messages, temperature = 0.7, maxTokens = 1500) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    console.log(`Calling OpenAI API with model: ${OPENAI_MODEL}`);
    
    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: OPENAI_MODEL,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    throw new Error(`OpenAI API Error: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Function to analyze CV against job description
async function analyzeCV(cvContent, jobDescription) {
  const messages = [
    {
      role: "system",
      content: `You are an expert CV analyst and career advisor. Your task is to analyze a CV against a job description and provide a detailed match analysis. 
      Your analysis should include:
      1. An overall match score (percentage)
      2. Key strengths that match the job requirements
      3. Areas for improvement or missing skills
      4. Keywords found in both the CV and job description
      5. Important keywords in the job description that are missing from the CV
      Your response should be structured in JSON format.`
    },
    {
      role: "user",
      content: `Please analyze this CV against the following job description:
      
      CV Content:
      ${cvContent}
      
      Job Description:
      ${jobDescription}
      
      Provide your analysis in the following JSON format:
      {
        "match_score": number,
        "overview": "string",
        "strengths": ["string"],
        "weaknesses": ["string"],
        "keywords_found": ["string"],
        "keywords_missing": ["string"]
      }`
    }
  ];

  const result = await callOpenAI(messages, 0.5);
  
  try {
    // Parse the result as JSON and ensure required fields exist
    const jsonResult = JSON.parse(result);
    
    // Ensure all required fields exist
    const requiredFields = [
      'match_score', 'overview', 'strengths', 
      'weaknesses', 'keywords_found', 'keywords_missing'
    ];
    
    for (const field of requiredFields) {
      if (jsonResult[field] === undefined) {
        jsonResult[field] = field.includes('keywords') || 
                           field === 'strengths' || 
                           field === 'weaknesses' 
                           ? [] : field === 'match_score' ? 70 : '';
      }
    }
    
    return jsonResult;
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Failed to parse AI analysis response');
  }
}

// Function to optimize CV sections
async function optimizeCV(cvSections, jobDescription) {
  const messages = [
    {
      role: "system",
      content: `You are an expert CV optimizer. Your task is to improve CV sections to better match a job description.
      For each section, provide:
      1. Optimized content that better aligns with the job requirements
      2. A list of specific improvements made
      Your optimizations should be professional, honest, and highlight relevant skills and experiences.`
    },
    {
      role: "user",
      content: `Please optimize the following CV sections for this job description:
      
      Job Description:
      ${jobDescription}
      
      CV Sections:
      ${JSON.stringify(cvSections, null, 2)}
      
      For each section, provide the optimized content and a list of improvements made.
      Return your response as valid JSON in this format:
      {
        "optimized_sections": [
          {
            "section": "section_name",
            "original_content": "original text",
            "optimized_content": "improved text",
            "improvements": ["improvement 1", "improvement 2"]
          }
        ]
      }`
    }
  ];

  const result = await callOpenAI(messages, 0.7, 2000);
  
  try {
    return JSON.parse(result);
  } catch (error) {
    console.error('Error parsing OpenAI CV optimization response:', error);
    throw new Error('Failed to parse AI optimization response');
  }
}

// Function to generate a cover letter
async function generateAICoverLetter(cvContent, jobDescription, companyName, recipientName, positionTitle, userComments) {
  const messages = [
    {
      role: "system",
      content: `You are an expert in professional communication and career services. Your task is to generate a tailored cover letter based on a CV and job description. 
      The cover letter should:
      1. Be professionally formatted with proper date, addressee, and signature
      2. Highlight relevant experience and skills from the CV that match the job requirements
      3. Express enthusiasm for the specific company and position
      4. Sound natural and personalized, not generic
      5. Include any specific points mentioned in the user's comments`
    },
    {
      role: "user",
      content: `Please generate a professional cover letter based on the following information:
      
      CV Content:
      ${cvContent}
      
      Job Description:
      ${jobDescription}
      
      Company Name: ${companyName || 'the Company'}
      Recipient Name: ${recipientName || 'Hiring Manager'}
      Position Title: ${positionTitle || 'the position'}
      Additional Comments: ${userComments || ''}
      
      Return your response with:
      - The complete formatted cover letter text
      - A list of key points addressed in the letter
      - A list of keywords from the job description that were used in the letter`
    }
  ];

  try {
    const result = await callOpenAI(messages, 0.7, 2000);
    
    // Extract the cover letter from the response
    // For simplicity, we'll assume the entire response is the cover letter
    // In a production environment, you might want to parse the response more carefully
    
    // Extract key points (this is a simplified implementation)
    const keyPoints = [
      "Highlighted relevant experience",
      "Expressed enthusiasm for the role",
      "Connected skills to job requirements",
      "Demonstrated knowledge of the company",
      "Included specific achievements"
    ];
    
    // Extract keywords (simplified implementation)
    let keywords = [];
    if (jobDescription) {
      const keywordMatches = jobDescription.match(/\b\w{5,}\b/g) || [];
      keywords = [...new Set(keywordMatches)].slice(0, 10).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      );
    }
    
    return {
      cover_letter: result,
      key_points: keyPoints,
      keywords_used: keywords
    };
  } catch (error) {
    console.error('Error generating AI cover letter:', error);
    throw new Error('Failed to generate AI cover letter');
  }
}

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working correctly',
    requestHeaders: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Force real service connection with a specific header
app.use((req, res, next) => {
  // Check for a special header that forces use of the real service
  if (req.headers['x-use-real-service'] === 'true' || req.query.use_real_service === 'true') {
    const servicePath = req.path.split('/')[2]; // Extract service name from path
    if (servicePath && SERVICE_URLS[servicePath]) {
      console.log(`Forcing use of real service for ${req.method} ${req.originalUrl}`);
      return createProxy(servicePath, SERVICE_URLS[servicePath])(req, res, next);
    }
  }
  next();
});

// Mock CV endpoints
app.get('/api/cv', (req, res) => {
  console.log('Received request for CV list');
  
  // Create mock CV data
  const cvs = [
    {
      id: 'cv-001',
      title: 'Software Developer Resume',
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-04-10T14:20:00Z',
      user_id: req.headers.authorization ? 'user-from-token' : 'anonymous-user',
      sections: [
        { id: 'personal', title: 'Personal Information', order: 1 },
        { id: 'education', title: 'Education', order: 2 },
        { id: 'experience', title: 'Work Experience', order: 3 },
        { id: 'skills', title: 'Skills', order: 4 }
      ],
      status: 'active'
    },
    {
      id: 'cv-002',
      title: 'Project Manager CV',
      created_at: '2025-02-20T09:15:00Z',
      updated_at: '2025-04-12T11:45:00Z',
      user_id: req.headers.authorization ? 'user-from-token' : 'anonymous-user',
      sections: [
        { id: 'personal', title: 'Personal Details', order: 1 },
        { id: 'summary', title: 'Professional Summary', order: 2 },
        { id: 'experience', title: 'Project Experience', order: 3 },
        { id: 'education', title: 'Education', order: 4 },
        { id: 'certificates', title: 'Certifications', order: 5 }
      ],
      status: 'active'
    }
  ];
  
  res.status(200).json({
    status: 'success',
    data: cvs,
    count: cvs.length,
    timestamp: new Date().toISOString()
  });
});

// CV detail endpoint
app.get('/api/cv/:id', (req, res) => {
  console.log(`Received request for CV with ID: ${req.params.id}`);
  
  // Create mock CV data based on the requested ID
  const cv = {
    id: req.params.id,
    title: req.params.id === 'cv-001' ? 'Software Developer Resume' : 'Project Manager CV',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-04-10T14:20:00Z',
    user_id: req.headers.authorization ? 'user-from-token' : 'anonymous-user',
    sections: [
      {
        id: 'personal',
        title: 'Personal Information',
        order: 1,
        items: [
          { field: 'name', value: 'John Doe' },
          { field: 'email', value: 'john.doe@example.com' },
          { field: 'phone', value: '+1-555-123-4567' },
          { field: 'location', value: 'New York, NY' }
        ]
      },
      {
        id: 'education',
        title: 'Education',
        order: 2,
        items: [
          {
            title: 'Bachelor of Science in Computer Science',
            institution: 'New York University',
            start_date: '2018-09-01',
            end_date: '2022-05-31',
            description: 'Graduated with honors. Specialized in Software Engineering.'
          }
        ]
      },
      {
        id: 'experience',
        title: 'Work Experience',
        order: 3,
        items: [
          {
            title: 'Software Developer',
            company: 'Tech Solutions Inc.',
            start_date: '2022-06-15',
            end_date: null,
            current: true,
            description: 'Developing and maintaining web applications using React and Node.js.'
          },
          {
            title: 'Intern Developer',
            company: 'WebDev Studios',
            start_date: '2021-06-01',
            end_date: '2021-08-31',
            current: false,
            description: 'Assisted in frontend development and UI/UX improvements.'
          }
        ]
      },
      {
        id: 'skills',
        title: 'Skills',
        order: 4,
        items: [
          { skill: 'JavaScript', level: 'Expert' },
          { skill: 'React', level: 'Advanced' },
          { skill: 'Node.js', level: 'Advanced' },
          { skill: 'Python', level: 'Intermediate' },
          { skill: 'SQL', level: 'Intermediate' }
        ]
      }
    ],
    status: 'active'
  };
  
  res.status(200).json({
    status: 'success',
    data: cv,
    timestamp: new Date().toISOString()
  });
});

// CV-specific optimization endpoint
app.post('/api/cv/:id/optimize', (req, res) => {
  console.log(`Received CV-specific optimization request for CV ID: ${req.params.id}`, req.body);
  
  try {
    const cvId = req.params.id;
    const jobDescription = req.body.jobDescription;
    const companyName = req.body.companyName || '';
    const position = req.body.position || '';
    
    if (!jobDescription) {
      return res.status(400).json({
        status: 'error',
        message: 'Job description is required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Optimizing CV ${cvId} with job description for ${position} at ${companyName}`);
    
    // Generate mock optimization results
    const sections = [
      {
        section: 'summary',
        original_content: 'Experienced professional with background in software development.',
        optimized_content: `Results-driven professional with extensive experience in software development and ${position.toLowerCase() || 'relevant industry'}. Proven track record of delivering high-quality solutions that align with business objectives.`,
        improvements: [
          'Added specific industry focus',
          'Emphasized results-oriented approach',
          'Aligned with job requirements'
        ]
      },
      {
        section: 'experience_0',
        original_content: 'Led development team and implemented new features.',
        optimized_content: `Spearheaded development initiatives for ${companyName || 'industry-leading clients'}, successfully implementing new features that resulted in 30% improvement in system performance and enhanced user experience.`,
        improvements: [
          'Added quantifiable metrics',
          'Enhanced description of leadership role',
          'Highlighted outcomes and impact'
        ]
      },
      {
        section: 'skills',
        original_content: 'Programming, Problem-solving, Communication',
        optimized_content: 'JavaScript, React, Node.js, Python, SQL, Problem-solving, Team leadership, Technical documentation, Agile methodologies',
        improvements: [
          'Added specific technical skills',
          'Included more relevant technologies',
          'Expanded skill set to match job requirements'
        ]
      }
    ];
    
    // Return optimization results
    res.status(200).json({
      status: 'success',
      message: 'CV optimized successfully',
      cv_id: cvId,
      job_description: jobDescription,
      company_name: companyName,
      position: position,
      optimized_sections: sections,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in CV-specific optimization endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Create CV endpoint
app.post('/api/cv', (req, res) => {
  console.log('Received request to create a new CV:', req.body);
  
  // Create a new CV with the provided data or defaults
  const newCV = {
    id: `cv-${Date.now()}`,
    title: req.body.title || 'Untitled CV',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: req.headers.authorization ? 'user-from-token' : 'anonymous-user',
    sections: req.body.sections || [
      { id: 'personal', title: 'Personal Information', order: 1 },
      { id: 'education', title: 'Education', order: 2 },
      { id: 'experience', title: 'Work Experience', order: 3 },
      { id: 'skills', title: 'Skills', order: 4 }
    ],
    status: 'active'
  };
  
  res.status(201).json({
    status: 'success',
    message: 'CV created successfully',
    data: newCV,
    timestamp: new Date().toISOString()
  });
});

// Update CV endpoint
app.put('/api/cv/:id', (req, res) => {
  console.log(`Received request to update CV with ID: ${req.params.id}`, req.body);
  
  // Return the updated CV (combine request data with existing mock data)
  const updatedCV = {
    id: req.params.id,
    title: req.body.title || 'Updated CV',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: new Date().toISOString(),
    user_id: req.headers.authorization ? 'user-from-token' : 'anonymous-user',
    sections: req.body.sections || [
      { id: 'personal', title: 'Personal Information', order: 1 },
      { id: 'education', title: 'Education', order: 2 },
      { id: 'experience', title: 'Work Experience', order: 3 },
      { id: 'skills', title: 'Skills', order: 4 }
    ],
    status: req.body.status || 'active'
  };
  
  res.status(200).json({
    status: 'success',
    message: 'CV updated successfully',
    data: updatedCV,
    timestamp: new Date().toISOString()
  });
});

// Delete CV endpoint
app.delete('/api/cv/:id', (req, res) => {
  console.log(`Received request to delete CV with ID: ${req.params.id}`);
  
  res.status(200).json({
    status: 'success',
    message: `CV with ID ${req.params.id} deleted successfully`,
    timestamp: new Date().toISOString()
  });
});

// Create proxy middleware function
const createProxy = (serviceName, targetUrl) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    timeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
      // Log proxy requests for debugging
      console.log(`Proxying ${req.method} request to ${serviceName}: ${req.path}`);
      
      // Add debugging headers
      proxyReq.setHeader('X-Proxy-Service', serviceName);
      proxyReq.setHeader('X-Proxy-Target', targetUrl);
      proxyReq.setHeader('X-Original-URL', req.originalUrl);
    },
    pathRewrite: (path, req) => {
      // For OPTIONS requests, return null to prevent proxying
      if (req.method === 'OPTIONS') {
        return null;
      }
      // Log the path rewrite for debugging
      console.log(`Path rewrite: ${path} -> ${path}`);
      return path;
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceName}: ${err.message}`, {
        service: serviceName,
        targetUrl,
        originalUrl: req.originalUrl,
        path: req.path,
        method: req.method,
        error: err.message
      });
      
      // For OPTIONS requests, handle directly
      if (req.method === 'OPTIONS') {
        // Allow requests from any origin in development
        const origin = req.headers.origin;
        if (origin) {
          res.header('Access-Control-Allow-Origin', origin);
        } else {
          res.header('Access-Control-Allow-Origin', '*');
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
        res.status(200).end();
        return;
      }
      
      // Set proper CORS headers in error response
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
      } else {
        res.header('Access-Control-Allow-Origin', '*');
      }
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      res.status(503).json({
        status: 'error',
        message: `${serviceName} service temporarily unavailable`,
        error: err.message,
        originalUrl: req.originalUrl,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Set up service routes - Note: These will only be used if a request doesn't match our local routes
app.use('/api/auth', (req, res, next) => {
  // We have local implementations for these auth routes
  if (req.path === '/register' || req.path === '/login') {
    return next('route'); // Skip the proxy for these routes
  }
  return createProxy('auth', SERVICE_URLS.auth)(req, res, next);
});

app.use('/api/users', createProxy('user', SERVICE_URLS.user));

// Modified CV proxy to prioritize local implementations except for AI optimization
app.use('/api/cv', (req, res, next) => {
  // Pass through AI optimization requests to the real service
  if (req.path.includes('/optimize') || req.path.includes('/ai') || req.originalUrl.includes('/optimize') || req.originalUrl.includes('/ai')) {
    console.log('Forwarding AI optimization request to the real CV service:', req.originalUrl);
    return createProxy('cv', SERVICE_URLS.cv)(req, res, next);
  }
  
  // Extract the path parts
  const pathParts = req.path.split('/').filter(Boolean);
  const isRootPath = pathParts.length === 0;
  const hasId = pathParts.length > 0;
  
  // For other CV endpoints, use our local mock implementations
  // Use next('route') only for paths that we've already defined as middleware above
  if (req.method === 'GET' && isRootPath) {
    // The root CV endpoint (list CVs) is handled by our mock implementation
    console.log('Using mock implementation for GET /api/cv');
    return next('route');
  } else if (req.method === 'GET' && hasId && !pathParts[0].includes('optimize') && !pathParts[0].includes('ai')) {
    // The CV detail endpoint is handled by our mock implementation unless it's an optimization request
    console.log(`Using mock implementation for GET /api/cv/${pathParts[0]}`);
    return next('route');
  } else if (req.method === 'POST' && isRootPath) {
    // The create CV endpoint is handled by our mock implementation
    console.log('Using mock implementation for POST /api/cv');
    return next('route');
  } else if (req.method === 'PUT' && hasId) {
    // The update CV endpoint is handled by our mock implementation
    console.log(`Using mock implementation for PUT /api/cv/${pathParts[0]}`);
    return next('route');
  } else if (req.method === 'DELETE' && hasId) {
    // The delete CV endpoint is handled by our mock implementation
    console.log(`Using mock implementation for DELETE /api/cv/${pathParts[0]}`);
    return next('route');
  }
  
  // Log the request that's being forwarded
  console.log(`Forwarding request to real CV service: ${req.method} ${req.originalUrl}`);
  
  // For anything else, try the real service
  return createProxy('cv', SERVICE_URLS.cv)(req, res, next);
});

app.use('/api/export', createProxy('export', SERVICE_URLS.export));

// Modified AI service proxy to prioritize local implementations
app.use('/api/ai', (req, res, next) => {
  // Remove all local mock implementations and always use the real AI service
  console.log(`Forwarding AI service request to real service: ${req.originalUrl}`);
  return createProxy('ai', SERVICE_URLS.ai)(req, res, next);
});

app.use('/api/payments', createProxy('payment', SERVICE_URLS.payment));

// Default 404 handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    headers: req.headers,
    query: req.query,
    body: req.body
  });
  
  // Set proper CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_routes: [
      '/api/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/cv',
      '/api/cv/:id',
      '/api/ai/job-match/analyze',
      '/api/debug/echo'
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simplified API Gateway running on port ${PORT}`);
  console.log('\nConfigured Services:');
  Object.entries(SERVICE_URLS).forEach(([service, url]) => {
    console.log(`- ${service.toUpperCase()} Service: ${url}`);
  });
});

module.exports = app; 