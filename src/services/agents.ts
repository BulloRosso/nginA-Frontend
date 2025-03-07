// src/services/agents.ts
import { Agent, AgentCreateDto } from '../types/agent';
import api from './api';

// Mock data for demonstration purposes
const mockAgents: Agent[] = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    title: { en: 'Image Creator', de: 'Bild-Generator' },
    description: { 
      en: 'Creates images from text descriptions using AI', 
      de: 'Erzeugt Bilder aus Textbeschreibungen mit Hilfe von KI' 
    },
    input: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Text description of the image to generate'
        },
        style: {
          type: 'string',
          enum: ['realistic', 'cartoon', 'oil-painting', 'sketch'],
          description: 'Style of the generated image'
        },
        width: {
          type: 'integer',
          minimum: 256,
          maximum: 1024,
          description: 'Width of the generated image in pixels'
        },
        height: {
          type: 'integer',
          minimum: 256,
          maximum: 1024,
          description: 'Height of the generated image in pixels'
        }
      },
      required: ['prompt']
    },
    output: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: 'URL to the generated image'
        },
        generation_time: {
          type: 'number',
          description: 'Time taken to generate the image in seconds'
        }
      }
    },
    credits_per_run: 10,
    stars: 4,
    authenticaion: 'api_key',
    icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5,3A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3H5M19,19H5V5H19V19M10,10V8H8V10H10M8,14V16H10V14H8M14,16H16V14H14V16M16,10V8H14V10H16" /></svg>'
  },
  {
    id: '2',
    created_at: new Date().toISOString(),
    title: { en: 'Text Summarizer', de: 'Text-Zusammenfasser' },
    description: {
      en: 'Summarizes long text into concise key points',
      de: 'Fasst langen Text zu prägnanten Kernaussagen zusammen'
    },
    input: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The long text to summarize'
        },
        max_points: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          description: 'Maximum number of key points in the summary'
        },
        language: {
          type: 'string',
          enum: ['en', 'de', 'fr', 'es'],
          description: 'Language of the output summary'
        }
      },
      required: ['text']
    },
    output: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Summarized text'
        },
        key_points: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'List of key points from the text'
        }
      }
    },
    credits_per_run: 5,
    stars: 5,
    authenticaion: 'oauth2',
    icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 4V7H7V19H10V7H15V4H2M21 9H12V12H15V19H18V12H21V9Z" /></svg>'
  },
  {
    id: '3',
    created_at: new Date().toISOString(),
    title: { en: 'Social Post Generator', de: 'Social-Media-Post-Generator' },
    description: {
      en: 'Creates engaging social media posts from article links or topics',
      de: 'Erstellt ansprechende Social-Media-Beiträge aus Artikellinks oder Themen'
    },
    input: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the article to create a post from (optional)'
        },
        topic: {
          type: 'string',
          description: 'Topic to create a post about (if no URL is provided)'
        },
        platform: {
          type: 'string',
          enum: ['twitter', 'linkedin', 'facebook', 'instagram'],
          description: 'Social media platform for the post'
        },
        include_hashtags: {
          type: 'boolean',
          description: 'Whether to include relevant hashtags'
        },
        tone: {
          type: 'string',
          enum: ['professional', 'casual', 'enthusiastic', 'informative'],
          description: 'Tone of the post'
        }
      },
      required: ['platform']
    },
    output: {
      type: 'object',
      properties: {
        post_text: {
          type: 'string',
          description: 'Text for the social media post'
        },
        hashtags: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Suggested hashtags for the post'
        },
        image_prompt: {
          type: 'string',
          description: 'Suggested image prompt to accompany the post'
        }
      }
    },
    credits_per_run: 3,
    stars: 4,
    authenticaion: 'api_key',
    icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z" /></svg>'
  },
  {
    id: '4',
    created_at: new Date().toISOString(),
    title: { en: 'Data Analyzer', de: 'Datenanalysator' },
    description: {
      en: 'Analyzes CSV data and provides insights and visualizations',
      de: 'Analysiert CSV-Daten und liefert Erkenntnisse und Visualisierungen'
    },
    input: {
      type: 'object',
      properties: {
        csv_data: {
          type: 'string',
          description: 'CSV data to analyze'
        },
        analysis_type: {
          type: 'string',
          enum: ['descriptive', 'correlation', 'trend', 'outlier', 'custom'],
          description: 'Type of analysis to perform'
        },
        target_column: {
          type: 'string',
          description: 'Main column to analyze'
        },
        include_visualizations: {
          type: 'boolean',
          description: 'Whether to include visualizations in results'
        },
        visualization_type: {
          type: 'string',
          enum: ['bar', 'line', 'scatter', 'pie', 'heatmap'],
          description: 'Type of visualization to create'
        }
      },
      required: ['csv_data', 'analysis_type']
    },
    output: {
      type: 'object',
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Key insights from the data analysis'
        },
        statistics: {
          type: 'object',
          description: 'Statistical results from the analysis'
        },
        visualization_urls: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'URLs to generated visualizations'
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Recommendations based on data analysis'
        }
      }
    },
    credits_per_run: 8,
    stars: 4,
    authenticaion: 'oauth2',
    icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z" /></svg>'
  }
];

// Mock transformations for the agents
const mockTransformations = [
  {
    agent_id: '1',
    post_process_transformations: `function transform_input(input) {
  // Check if required fields are provided
  if (!input.prompt) {
    throw new Error('Prompt is required');
  }

  // Set default values if not provided
  const transformedInput = {
    prompt: input.prompt,
    style: input.style || 'realistic',
    width: input.width || 512,
    height: input.height || 512,
    enhanced: true,  // Add a new parameter for enhanced quality
    seed: Math.floor(Math.random() * 1000000)  // Add a random seed for reproducibility
  };

  // Append style keywords to prompt for better results
  const styleKeywords = {
    'realistic': 'photorealistic, detailed, high resolution',
    'cartoon': 'vibrant colors, simplified shapes, cartoon style',
    'oil-painting': 'oil painting texture, brush strokes, artistic',
    'sketch': 'pencil sketch, hand-drawn, monochrome'
  };

  if (styleKeywords[transformedInput.style]) {
    transformedInput.prompt += \`, \${styleKeywords[transformedInput.style]}\`;
  }

  // Validate dimensions are within allowed range
  transformedInput.width = Math.min(Math.max(transformedInput.width, 256), 1024);
  transformedInput.height = Math.min(Math.max(transformedInput.height, 256), 1024);

  // Round dimensions to nearest multiple of 8 (common requirement for some image models)
  transformedInput.width = Math.round(transformedInput.width / 8) * 8;
  transformedInput.height = Math.round(transformedInput.height / 8) * 8;

  return transformedInput;
}`
  },
  {
    agent_id: '3',
    post_process_transformations: `function transform_input(input) {
  // Default values for missing fields
  const transformedInput = {
    platform: input.platform || 'twitter',
    include_hashtags: input.include_hashtags === undefined ? true : input.include_hashtags,
    tone: input.tone || 'casual',
    max_length: getPlatformMaxLength(input.platform),
    url: input.url || null,
    topic: input.topic || null
  };

  // Make sure we have either a URL or a topic
  if (!transformedInput.url && !transformedInput.topic) {
    throw new Error('Either URL or topic must be provided');
  }

  // Add formatting guidance based on platform
  transformedInput.formatting = getPlatformFormatting(transformedInput.platform);

  // Add character limit warnings
  if (transformedInput.platform === 'twitter') {
    transformedInput.include_analytics_link = true;
    transformedInput.shorten_links = true;
  }

  // Add tone guidelines
  transformedInput.tone_guidelines = getToneGuidelines(transformedInput.tone);

  return transformedInput;

  // Platform-specific helper functions
  function getPlatformMaxLength(platform) {
    const lengths = {
      'twitter': 280,
      'linkedin': 3000,
      'facebook': 5000,
      'instagram': 2200
    };
    return lengths[platform] || 280;
  }

  function getPlatformFormatting(platform) {
    const formatting = {
      'twitter': 'Concise, engaging, with relevant hashtags',
      'linkedin': 'Professional, informative, with paragraph breaks',
      'facebook': 'Conversational, with questions to drive engagement',
      'instagram': 'Visual-focused, emoji-friendly, with hashtags at the end'
    };
    return formatting[platform] || '';
  }

  function getToneGuidelines(tone) {
    const guidelines = {
      'professional': 'Formal language, industry terminology, data-backed statements',
      'casual': 'Conversational, friendly, using contractions and simple language',
      'enthusiastic': 'Upbeat, exclamations, positive language, emojis',
      'informative': 'Educational, clear explanations, links to resources'
    };
    return guidelines[tone] || '';
  }
}`
  },
  {
    agent_id: '4',
    post_process_transformations: `function transform_input(input) {
  // Validate required fields
  if (!input.csv_data) {
    throw new Error('CSV data is required');
  }

  if (!input.analysis_type) {
    throw new Error('Analysis type is required');
  }

  // Set default values and transform input
  const transformedInput = {
    csv_data: input.csv_data,
    analysis_type: input.analysis_type,
    target_column: input.target_column || null,
    include_visualizations: input.include_visualizations !== false,
    visualization_type: input.visualization_type || getDefaultVisualizationType(input.analysis_type),
    advanced_options: {
      remove_outliers: input.analysis_type === 'outlier' ? false : true,
      confidence_level: 0.95,
      missing_data_strategy: 'drop',
      normalize_data: true
    }
  };

  // If we're looking at correlations but no target column is specified,
  // we'll do a correlation matrix of all numeric columns
  if (input.analysis_type === 'correlation' && !input.target_column) {
    transformedInput.do_correlation_matrix = true;
  }

  // For trend analysis, set time-based options
  if (input.analysis_type === 'trend') {
    transformedInput.advanced_options.seasonality_check = true;
    transformedInput.advanced_options.trend_projection_periods = 3;
  }

  // For custom analysis, provide additional formatting options
  if (input.analysis_type === 'custom') {
    if (!input.custom_query) {
      throw new Error('Custom analysis requires a custom_query');
    }
    transformedInput.custom_query = input.custom_query;
    transformedInput.result_format = input.result_format || 'json';
  }

  return transformedInput;

  // Helper function to determine visualization type based on analysis
  function getDefaultVisualizationType(analysisType) {
    const visualizationMap = {
      'descriptive': 'bar',
      'correlation': 'scatter',
      'trend': 'line',
      'outlier': 'scatter',
      'custom': 'bar'
    };
    return visualizationMap[analysisType] || 'bar';
  }
}`
  }
];

export class AgentService {
  static async getAgents(mockData: boolean = false): Promise<Agent[]> {
    if (mockData) {
      return mockAgents;
    }

    const response = await api.get('/api/v1/agents');
    return response.data;
  }

  static async getAgent(id: string, mockData: boolean = false): Promise<Agent | null> {
    if (mockData) {
      return mockAgents.find(agent => agent.id === id) || null;
    }

    try {
      const response = await api.get(`/api/v1/agents/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async createAgent(agentData: AgentCreateDto, mockData: boolean = false): Promise<Agent> {
    if (mockData) {
      const newAgent: Agent = {
        id: Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        title: agentData.title,
        description: agentData.description,
        input: agentData.input ? { type: 'object', properties: agentData.input } : undefined,
        output: agentData.output ? { type: 'object', properties: agentData.output } : undefined,
        credits_per_run: agentData.credits_per_run || 1,
        stars: agentData.stars || 0,
        authenticaion: agentData.authentication || 'none',
        icon_svg: agentData.icon_svg,
        max_execution_time_secs: agentData.max_execution_time_secs,
        agent_endpoint: agentData.agent_endpoint
      };

      return newAgent;
    }

    const response = await api.post('/api/v1/agents', agentData);
    return response.data;
  }

  static async updateAgent(id: string, agentData: Partial<AgentCreateDto>, mockData: boolean = false): Promise<Agent | null> {
    if (mockData) {
      const agentIndex = mockAgents.findIndex(agent => agent.id === id);
      if (agentIndex === -1) return null;

      const updatedAgent = {
        ...mockAgents[agentIndex],
        ...agentData,
        id: id, // Ensure ID doesn't change
        created_at: mockAgents[agentIndex].created_at // Ensure created_at doesn't change
      };

      return updatedAgent;
    }

    try {
      const response = await api.put(`/api/v1/agents/${id}`, agentData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async deleteAgent(id: string, mockData: boolean = false): Promise<boolean> {
    if (mockData) {
      return true; // Always successful in mock
    }

    await api.delete(`/api/v1/agents/${id}`);
    return true;
  }

  static async getAgentTransformations(agentId?: string, mockData: boolean = false): Promise<any[]> {
    
    let url = '/api/v1/transformations';
    if (agentId) {
      url += `?agent_id=${agentId}`;
    }

    const response = await api.get(url);
    return response.data;
  }

  static async discoverAgent(discoveryUrl: string, mockData: boolean = false): Promise<Agent> {
    if (mockData) {
      // For mock data, we'll create a new agent based on a template
      const newAgent: Agent = {
        id: Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        title: { en: 'Discovered Agent', de: 'Entdeckter Agent' },
        description: { 
          en: 'Agent discovered from external source', 
          de: 'Agent aus externer Quelle entdeckt' 
        },
        credits_per_run: 1,
        stars: 0,
        authenticaion: 'none',
        type: 'atom',
        agent_endpoint: discoveryUrl
      };

      return newAgent;
    }

    const response = await api.post('/api/v1/agents/discover', { agentDiscoveryUrl: discoveryUrl });
    return response.data;
  }

  static async testAgent(agentId: string, inputData: any, mockData: boolean = false): Promise<any> {
    if (mockData) {
      // For mock data, return a simple success response
      return {
        success: true,
        message: 'Agent test successful',
        result: {
          processed: true,
          inputData
        }
      };
    }

    const response = await api.post(`/api/v1/agents/${agentId}/test`, { input: inputData });
    return response.data;
  }

  static async updateAgentInput(id: string, inputData: { input?: any, input_example?: any }, mockData: boolean = false): Promise<Agent | null> {
    if (mockData) {
      const agentIndex = mockAgents.findIndex(agent => agent.id === id);
      if (agentIndex === -1) return null;

      const updatedAgent = {
        ...mockAgents[agentIndex],
        ...inputData,
        id: id, // Ensure ID doesn't change
        created_at: mockAgents[agentIndex].created_at // Ensure created_at doesn't change
      };

      // Update mockAgents array with updatedAgent
      mockAgents[agentIndex] = updatedAgent;
      console.log('Mock data updated:', updatedAgent);
      return updatedAgent;
    }

    try {
      console.log('Sending update to API for agent input:', id);

      // First get the current agent data
      const currentAgent = await AgentService.getAgent(id, false);
      if (!currentAgent) {
        console.error('Agent not found for update');
        return null;
      }

      // Create a proper AgentCreateDto object for update
      const updatePayload = {
        title: currentAgent.title,
        description: currentAgent.description,
        input: inputData.input || currentAgent.input,
        input_example: inputData.input_example,
        output: currentAgent.output,
        output_example: currentAgent.output_example,
        credits_per_run: currentAgent.credits_per_run,
        workflow_id: currentAgent.workflow_id,
        stars: currentAgent.stars,
        type: currentAgent.type || 'atom', // Default to 'atom' if not set
        authentication: currentAgent.authentication,
        icon_svg: currentAgent.icon_svg,
        max_execution_time_secs: currentAgent.max_execution_time_secs,
        agent_endpoint: currentAgent.agent_endpoint
      };

      console.log('Update payload:', JSON.stringify(updatePayload, null, 2));

      // Use PUT as required by backend
      const response = await api.put(`/api/v1/agents/${id}`, updatePayload);
      console.log('PUT response:', response);
      return response.data;
    } catch (error) {
      console.error('Error updating agent input:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async updateAgentOutput(id: string, outputData: { output?: any, output_example?: any }, mockData: boolean = false): Promise<Agent | null> {
    if (mockData) {
      const agentIndex = mockAgents.findIndex(agent => agent.id === id);
      if (agentIndex === -1) return null;

      const updatedAgent = {
        ...mockAgents[agentIndex],
        ...outputData,
        id: id, // Ensure ID doesn't change
        created_at: mockAgents[agentIndex].created_at // Ensure created_at doesn't change
      };

      // Update mockAgents array with updatedAgent
      mockAgents[agentIndex] = updatedAgent;
      console.log('Mock data updated:', updatedAgent);
      return updatedAgent;
    }

    try {
      console.log('Sending update to API for agent output:', id);

      // First get the current agent data
      const currentAgent = await AgentService.getAgent(id, false);
      if (!currentAgent) {
        console.error('Agent not found for update');
        return null;
      }

      // Create a proper AgentCreateDto object for update
      const updatePayload = {
        title: currentAgent.title,
        description: currentAgent.description,
        input: currentAgent.input,
        input_example: currentAgent.input_example,
        output: outputData.output || currentAgent.output,
        output_example: outputData.output_example,
        credits_per_run: currentAgent.credits_per_run,
        workflow_id: currentAgent.workflow_id,
        stars: currentAgent.stars,
        type: currentAgent.type || 'atom', // Default to 'atom' if not set
        authentication: currentAgent.authentication,
        icon_svg: currentAgent.icon_svg,
        max_execution_time_secs: currentAgent.max_execution_time_secs,
        agent_endpoint: currentAgent.agent_endpoint
      };

      console.log('Update payload:', JSON.stringify(updatePayload, null, 2));

      // Use PUT as required by backend
      const response = await api.put(`/api/v1/agents/${id}`, updatePayload);
      console.log('PUT response:', response);
      return response.data;
    } catch (error) {
      console.error('Error updating agent output:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }
  
  static async generateJsonSchema(exampleData: any, mockData: boolean = false): Promise<any> {
    if (mockData) {
      // For mock data, return a simple schema based on the example data
      const schemaType = typeof exampleData;
      return {
        type: schemaType === 'object' ? 'object' : schemaType,
        properties: schemaType === 'object' ? 
          Object.keys(exampleData).reduce((schema, key) => {
            schema[key] = { type: typeof exampleData[key] };
            return schema;
          }, {}) : 
          {}
      };
    }

    const response = await api.post('/api/v1/agents/generate-json-schema', { data: exampleData });
    return response.data;
  }
}

export default AgentService;