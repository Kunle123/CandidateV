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
  origin: ['https://candidate-v.vercel.app', 'https://candidate-oyfl01pgt-kunle-ibiduns-projects.vercel.app', 'http://localhost:3000', 'http://localhost:5173', '*'],
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

// Mock AI optimization endpoint
app.post('/api/ai/optimize', async (req, res) => {
  console.log('Received CV optimization request:', JSON.stringify(req.body, null, 2));
  
  try {
    // Extract CV ID, targets, and job description from request
    const { cv_id, targets, job_description, user_comments } = req.body;
    
    // Log validation details
    console.log('Validation check:');
    console.log('- cv_id present:', !!cv_id);
    console.log('- targets present:', !!targets);
    console.log('- targets is array:', Array.isArray(targets));
    console.log('- targets length:', targets ? targets.length : 0);
    
    if (!cv_id || !targets || targets.length === 0) {
      console.log('Validation failed, returning 400 error');
      return res.status(400).json({
        status: 'error',
        message: 'CV ID and optimization targets are required',
        timestamp: new Date().toISOString(),
        received_data: {
          has_cv_id: !!cv_id,
          has_targets: !!targets,
          targets_length: targets ? targets.length : 0,
          targets_format: targets ? typeof targets : 'undefined'
        }
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
      console.log('OpenAI API Key not configured, returning service offline message');
      
      // Return a service offline message instead of using mock implementation
      return res.status(503).json({
        status: 'error',
        message: 'AI service is currently offline. Please try again later.',
        service_status: 'offline',
        details: 'OpenAI API key is not configured. Contact the administrator to enable this feature.',
        timestamp: new Date().toISOString()
      });
      
      // The code below is now unreachable
      console.log('OpenAI API Key not configured, using mock implementation');
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
      // Get CV content from the actual CV service
      console.log(`Fetching CV data from CV service for ID: ${cv_id}`);
      const cvServiceUrl = `${SERVICE_URLS.cv}/api/cv/${cv_id}`;
      console.log(`Calling real CV service at: ${cvServiceUrl}`);
      const cvResponse = await axios.get(cvServiceUrl);
      
      if (cvResponse.data && cvResponse.data.data) {
        // Convert CV data to string format for analysis
        cvContent = JSON.stringify(cvResponse.data.data);
      } else {
        throw new Error('CV data not found');
      }
    } catch (error) {
      console.error('Error fetching CV data for AI processing:', error);
      // Instead, return an error response to the client
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve CV data for processing',
        error: error.message,
        cv_id: cv_id,
        timestamp: new Date().toISOString()
      });
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
      console.log('OpenAI API Key not configured, returning service offline message');
      
      // Return a service offline message instead of using mock implementation
      return res.status(503).json({
        status: 'error',
        message: 'AI service is currently offline. Please try again later.',
        service_status: 'offline',
        details: 'OpenAI API key is not configured. Contact the administrator to enable this feature.',
        timestamp: new Date().toISOString()
      });
      
      // The code below is now unreachable
      console.log('OpenAI API Key not configured, using mock implementation');
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
      Your response MUST be a valid JSON object without any markdown formatting, code blocks, or backticks.`
    },
    {
      role: "user",
      content: `Please analyze this CV against the following job description:
      
      CV Content:
      ${cvContent}
      
      Job Description:
      ${jobDescription}
      
      Provide your analysis in the following JSON format without any markdown formatting, code blocks, or backticks:
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
    // Clean the result in case OpenAI returned the JSON inside backticks or markdown code blocks
    let cleanedResult = result;
    
    // Remove any markdown code block indicators
    if (cleanedResult.includes('```json')) {
      cleanedResult = cleanedResult.replace(/```json/g, '');
    }
    if (cleanedResult.includes('```')) {
      cleanedResult = cleanedResult.replace(/```/g, '');
    }
    
    // Trim whitespace
    cleanedResult = cleanedResult.trim();
    
    // Parse the cleaned result as JSON
    const jsonResult = JSON.parse(cleanedResult);
    
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
    console.error('Raw OpenAI response:', result);
    
    // Return a fallback response instead of throwing an error
    return {
      match_score: 65,
      overview: "Analysis could not be generated due to a technical issue. Here's a basic assessment based on available information.",
      strengths: ["Experience appears relevant to job requirements", "Technical skills likely match position needs"],
      weaknesses: ["Further analysis needed to identify specific skill gaps", "Consider reviewing job-specific qualifications"],
      keywords_found: [],
      keywords_missing: [],
      error_details: error.message,
      is_fallback: true
    };
  }
}

// Function to optimize CV sections
async function optimizeCV(cvSections, jobDescription) {
  console.log('Starting CV optimization with sections:', JSON.stringify(cvSections, null, 2));
  
  // Ensure cvSections is in the expected format
  let formattedSections = cvSections;
  
  // If cvSections doesn't have what we need, try to fix the format
  if (!Array.isArray(cvSections) || (cvSections.length > 0 && !cvSections[0].section && !cvSections[0].content)) {
    console.log('Reformatting CV sections for OpenAI');
    // Try to reformat the data if it's not in the expected format
    formattedSections = [];
    
    // Handle case where it's an object with section names as keys
    if (typeof cvSections === 'object' && !Array.isArray(cvSections)) {
      for (const [key, value] of Object.entries(cvSections)) {
        formattedSections.push({
          section: key,
          content: typeof value === 'string' ? value : JSON.stringify(value)
        });
      }
    } 
    // Handle case where it's an array of different format
    else if (Array.isArray(cvSections)) {
      formattedSections = cvSections.map(item => {
        // Try to extract section and content from various formats
        const section = item.section || item.id || item.name || 'section';
        let content = item.content || item.text || item.value || '';
        
        // If content is an object, convert to string
        if (typeof content === 'object') {
          content = JSON.stringify(content);
        }
        
        return { section, content };
      });
    }
  }
  
  console.log('Formatted sections for OpenAI:', JSON.stringify(formattedSections, null, 2));
  
  const messages = [
    {
      role: "system",
      content: `You are an expert CV optimizer. Your task is to improve CV sections to better match a job description.
      For each section, provide:
      1. Optimized content that better aligns with the job requirements
      2. A list of specific improvements made
      Your optimizations should be professional, honest, and highlight relevant skills and experiences.
      Your response MUST be a valid JSON object without any markdown formatting, code blocks, or backticks.`
    },
    {
      role: "user",
      content: `Please optimize the following CV sections for this job description:
      
      Job Description:
      ${jobDescription || 'Not provided'}
      
      CV Sections:
      ${JSON.stringify(formattedSections, null, 2)}
      
      For each section, provide the optimized content and a list of improvements made.
      Return your response as valid JSON in this format without any markdown formatting, code blocks, or backticks:
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
    // Clean the result in case OpenAI returned the JSON inside backticks or markdown code blocks
    let cleanedResult = result;
    
    // Remove any markdown code block indicators
    if (cleanedResult.includes('```json')) {
      cleanedResult = cleanedResult.replace(/```json/g, '');
    }
    if (cleanedResult.includes('```')) {
      cleanedResult = cleanedResult.replace(/```/g, '');
    }
    
    // Trim whitespace
    cleanedResult = cleanedResult.trim();
    
    // Parse the cleaned result as JSON
    return JSON.parse(cleanedResult);
  } catch (error) {
    console.error('Error parsing OpenAI CV optimization response:', error);
    console.error('Raw OpenAI response:', result);
    
    // Return a fallback response instead of throwing an error
    return {
      optimized_sections: cvSections.map(section => ({
        section: section.section,
        original_content: section.content,
        optimized_content: section.content,
        improvements: ["Could not optimize this section due to a technical issue."]
      }))
    };
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
      5. Include any specific points mentioned in the user's comments
      
      Please provide your response as plain text, not as JSON or in a code block.`
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
      
      Return your response with the cover letter text in plain text format, not in a code block.`
    }
  ];

  try {
    const result = await callOpenAI(messages, 0.7, 2000);
    
    // For the cover letter, we don't need to parse JSON, but let's clean any potential markup
    let coverLetter = result;
    
    // Remove any markdown formatting if present
    if (coverLetter.includes('```')) {
      // Extract content between code blocks if present
      const matches = coverLetter.match(/```(?:plain text|text)?([\s\S]*?)```/);
      if (matches && matches[1]) {
        coverLetter = matches[1].trim();
      } else {
        // Just remove the backticks
        coverLetter = coverLetter.replace(/```/g, '').trim();
      }
    }
    
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
      cover_letter: coverLetter,
      key_points: keyPoints,
      keywords_used: keywords
    };
  } catch (error) {
    console.error('Error generating AI cover letter:', error);
    console.error('API response or error:', error.response?.data || error.message);
    
    // Instead, return an error response to the client
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate cover letter',
      error: error.message,
      cv_id: cv_id,
      timestamp: new Date().toISOString()
    });
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

// Helper function to create proxy middleware with logging
const createProxy = (serviceName, targetUrl, options = {}) => {
  const defaultOptions = {
    target: targetUrl,
    changeOrigin: true,
    // Default pathRewrite - remove if overridden in options
    pathRewrite: {
      [`^/api/${serviceName}`]: '', 
    },
    logLevel: 'debug', 
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[${serviceName} Proxy] Request URL: ${req.originalUrl}`);
      console.log(`[${serviceName} Proxy] Target URL: ${targetUrl}`);
      console.log(`[${serviceName} Proxy] Forwarding path: ${proxyReq.path}`); // Log the actual path being forwarded
      
      if (req.body && Object.keys(req.body).length > 0) {
          // Avoid logging sensitive data like passwords in production
          // Consider logging only keys or a masked version if needed for debugging
          // console.log(`[${serviceName} Proxy] Request Body Keys:`, Object.keys(req.body));
      }
      
      proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
      proxyReq.setHeader('X-Forwarded-For', req.ip);
      if (req.headers.authorization) {
        console.log(`[${serviceName} Proxy] Forwarding Authorization header.`);
        proxyReq.setHeader('Authorization', req.headers.authorization);
      } else {
        // console.log(`[${serviceName} Proxy] No Authorization header found to forward.`); // Reduce noise
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[${serviceName} Proxy] Received response: ${proxyRes.statusCode} for path ${req.originalUrl} from ${targetUrl}`);
    },
    onError: (err, req, res) => {
      console.error(`[${serviceName} Proxy] Error for ${req.originalUrl}:`, err);
      // Avoid sending detailed error messages to client in production
      if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' }); // Use 502 Bad Gateway for proxy errors
      }
      res.end(JSON.stringify({ message: 'Proxy Error', details: 'Could not connect to the target service.' }));
    }
  };
  
  // Merge default options with provided options
  // Specifically, if pathRewrite is provided in options, it overrides the default.
  // If pathRewrite is explicitly set to null or false in options, it removes the default rewrite.
  const finalOptions = { ...defaultOptions, ...options };
  if (options.pathRewrite === null || options.pathRewrite === false) {
    delete finalOptions.pathRewrite; // Remove pathRewrite if explicitly told to
  }
  
  return createProxyMiddleware(finalOptions);
};

// Set up service routes - Note: These will only be used if a request doesn't match our local routes
app.use('/api/auth', createProxy('auth', SERVICE_URLS.auth, { pathRewrite: null }));

app.use('/api/users', createProxy('user', SERVICE_URLS.user));

// Proxy requests for /api/cv, except for AI-related paths
app.use('/api/cv', (req, res, next) => {
  // Pass through AI optimization requests directly to the dedicated AI proxy below if needed,
  // OR handle them within the CV service itself if it calls the AI service.
  // For now, let's assume non-AI CV requests go to the CV service proxy.
  if (req.path.includes('/optimize') || req.path.includes('/ai') || req.originalUrl.includes('/optimize') || req.originalUrl.includes('/ai')) {
    console.log('Skipping CV proxy for AI-related path:', req.originalUrl);
     return createProxy('cv', SERVICE_URLS.cv)(req, res, next); // Or next() if AI routes handled separately
  }

  // Proxy all other /api/cv requests to the CV service
  console.log(`Proxying CV request to real CV service: ${req.method} ${req.originalUrl}`);
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