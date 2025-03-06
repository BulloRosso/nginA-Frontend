// src/components/agents/AgentWrapperWizard.tsx
import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Button,
  Modal,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormHelperText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { AgentService } from '../../services/agents';
import MonacoEditor from '@monaco-editor/react';
import { I18nContent } from '../../types/agent';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  dir?: string;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wrapper-tabpanel-${index}`}
      aria-labelledby={`wrapper-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface AgentWrapperWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AgentWrapperWizard: React.FC<AgentWrapperWizardProps> = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation(['agents', 'common']);
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Form state
  const [agentUrl, setAgentUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authentication, setAuthentication] = useState<string>('none');
  const [headerName, setHeaderName] = useState('');
  const [basicAuthLogin, setBasicAuthLogin] = useState('');
  const [basicAuthPassword, setBasicAuthPassword] = useState('');
  const [inputJson, setInputJson] = useState('{\n  "example": "value"\n}');
  const [outputJson, setOutputJson] = useState('{\n  "result": "value"\n}');
  const [inputSchema, setInputSchema] = useState<any>(null);
  const [outputSchema, setOutputSchema] = useState<any>(null);
  const [isInputValid, setIsInputValid] = useState<boolean>(false);
  const [isOutputValid, setIsOutputValid] = useState<boolean>(false);
  const [iconSvg, setIconSvg] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [creditsPerRun, setCreditsPerRun] = useState<number>(0);
  const [maxExecutionTime, setMaxExecutionTime] = useState<number>(30);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const generateSchema = async (jsonData: string, type: 'input' | 'output'): Promise<boolean> => {
    try {
      // First check if the JSON is a valid schema already
      const parsedJson = JSON.parse(jsonData);

      // Check if it's already a JSON schema
      if (parsedJson.$schema && parsedJson.$schema.includes('json-schema.org')) {
        if (type === 'input') {
          setInputSchema(parsedJson);
          setIsInputValid(true);
        } else {
          setOutputSchema(parsedJson);
          setIsOutputValid(true);
        }
        return true;
      }

      // If not a schema, send to backend for conversion
      const generatedSchema = await AgentService.generateJsonSchema(parsedJson);

      if (type === 'input') {
        setInputSchema(generatedSchema);
        setIsInputValid(true);
      } else {
        setOutputSchema(generatedSchema);
        setIsOutputValid(true);
      }

      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Invalid JSON format';
      setErrors(prev => ({
        ...prev,
        [type === 'input' ? 'inputJson' : 'outputJson']: errorMessage
      }));

      if (type === 'input') {
        setIsInputValid(false);
      } else {
        setIsOutputValid(false);
      }

      return false;
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // What is a wrapper
        return true;
      case 1: // Agent URL
        if (!agentUrl) newErrors.agentUrl = t('common.field_required');
        break;
      case 1: // Title and Description
        if (!title) newErrors.title = t('common.field_required');
        if (!description) newErrors.description = t('common.field_required');
        break;
      case 2: // Authentication
        if (authentication === 'header' && !headerName) {
          newErrors.headerName = t('common.field_required');
        }
        if (authentication === 'basic-auth') {
          if (!basicAuthLogin) newErrors.basicAuthLogin = t('common.field_required');
          if (!basicAuthPassword) newErrors.basicAuthPassword = t('common.field_required');
        }
        break;
      case 4: // Input JSON
        try {
          if (!inputJson) {
            newErrors.inputJson = t('common.field_required');
            return false;
          } else {
            // Just validate it's parseable JSON for now
            // The actual schema conversion will happen when proceeding
            JSON.parse(inputJson);
          }
        } catch (e) {
          newErrors.inputJson = t('agents.invalid_json');
          return false;
        }
        break;
      case 5: // Output JSON
        try {
          if (!outputJson) {
            newErrors.outputJson = t('common.field_required');
            return false;
          } else {
            // Just validate it's parseable JSON for now
            // The actual schema conversion will happen when proceeding
            JSON.parse(outputJson);
          }
        } catch (e) {
          newErrors.outputJson = t('agents.invalid_json');
          return false;
        }
        break;
      // No validation needed for icon upload
      case 6: // Credits and execution time
        if (creditsPerRun < 0) newErrors.creditsPerRun = t('agents.must_be_positive');
        if (maxExecutionTime <= 0) newErrors.maxExecutionTime = t('agents.must_be_positive');
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(activeStep)) {
      // If we're leaving the input or output JSON steps, validate and generate schema
      if (activeStep === 4) { // Input JSON
        setIsLoading(true);
        const isValid = await generateSchema(inputJson, 'input');
        setIsLoading(false);
        if (!isValid) return;
      } else if (activeStep === 5) { // Output JSON
        setIsLoading(true);
        const isValid = await generateSchema(outputJson, 'output');
        setIsLoading(false);
        if (!isValid) return;
      }

      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setIconSvg(result);
        setIconPreview(result);
      };
      reader.readAsText(file);
    }
  };

  const handleCreateWrapper = async () => {
    // Do a final validation of all steps
    for (let i = 0; i <= 7; i++) {
      if (!validateStep(i)) {
        setActiveStep(i);
        return;
      }
    }

    // Make sure we have valid schemas
    if (!isInputValid || !isOutputValid) {
      setError(t('agents.invalid_schemas'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare the authentication value based on the selected type
      let finalAuthentication = authentication;
      if (authentication === 'header') {
        finalAuthentication = `header:${headerName}`;
      } else if (authentication === 'basic-auth') {
        finalAuthentication = `basic-auth:${basicAuthLogin},${basicAuthPassword}`;
      }

      // Prepare the data for API
      const agentData = {
        title: {
          en: title,
          de: title // Duplicating English for now, can be updated later
        } as I18nContent,
        description: {
          en: description,
          de: description // Duplicating English for now, can be updated later
        } as I18nContent,
        input: inputSchema,
        output: outputSchema,
        workflow_id: agentUrl,
        authentication: finalAuthentication,
        credits_per_run: creditsPerRun,
        max_execution_time_secs: maxExecutionTime,
        icon_svg: iconSvg,
        agent_endpoint: `${import.meta.env.VITE_API_BASE_URL}/mockup-agents/wrapper/`
      };

      await AgentService.createAgent(agentData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create agent wrapper');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={!isLoading ? onClose : undefined}
      aria-labelledby="create-agent-wrapper-modal"
    >
      <Paper sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: '550px',
        width: isMobile ? '90%' : '850px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        bgcolor: 'background.paper',
        boxShadow: 24,
        borderRadius: 1,
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          px: 2,
          pt: 1
        }}>
          <Typography variant="h6" component="h2">
            {t('agents.create_wrapper_title')}
          </Typography>
          <IconButton onClick={onClose} aria-label="close" disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', height: '80vh', maxHeight: '640px' }}>
          {/* Left sidebar with image and tabs */}
          <Box sx={{ 
            width: '30%', 
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              p: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 2
            }}>
              <img 
                src="/img/wrapper.png" 
                alt="Basic Bot" 
                style={{ 
                  height: '180px',
                  objectFit: 'contain'
                }} 
              />
            </Box>

            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={activeStep}
              onChange={(_, newValue) => setActiveStep(newValue)}
              sx={{ 
                borderRight: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  py: 1.5
                }
              }}
            >
              <Tab label={t('agents.what_is_wrapper')} id="wrapper-tab-0" />
              <Tab label={t('agents.agent_url')} id="wrapper-tab-1" />
              <Tab label={t('agents.title_description')} id="wrapper-tab-2" />
              <Tab label={t('agents.authentication')} id="wrapper-tab-3" />
              <Tab label={t('agents.input_schema')} id="wrapper-tab-4" />
              <Tab label={t('agents.output_schema')} id="wrapper-tab-5" />
              <Tab label={t('agents.icon')} id="wrapper-tab-6" />
              <Tab label={t('agents.operation_params')} id="wrapper-tab-7" />
            </Tabs>
          </Box>

          {/* Main content area */}
          <Box sx={{ width: '70%', p: 2, overflowY: 'auto' }}>
            {/* What is a wrapper */}
            <TabPanel value={activeStep} index={0}>
              <Box sx={{ 
                  mt: 2,
                  '& h1': {
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    color: theme.palette.primary.main
                  },
                  '& p': {
                    marginBottom: '20px'
                  },
                  '& ul': {
                    paddingLeft: '2rem',
                    marginBottom: '1rem'
                  },
                  '& li': {
                    marginBottom: '0.5rem',
                    listStyleType: 'disc'
                  },
                  '& strong': {
                    fontWeight: 'bold'
                  }
                }}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(
                      marked(`# What is a Wrapper?

You can 'wrap' an existing agent so it can be used by nginA. The wrapper is managed by nginA and allows your agent to be inserted into agentic workflows which require the metadata you have to enter in the following steps.

Your agent must have **a public https URL** which responds to a POST request with JSON.

A wrapper allows you to:
* Integrate your existing agent into the nginA ecosystem
* Use your agent in workflows
* Provide proper metadata and schema definitions
* Control authentication and execution parameters
`))
                  }} 
                />
              </Box>
            </TabPanel>

            {/* Agent URL */}
            <TabPanel value={activeStep} index={1}>
              <Typography variant="body1" gutterBottom>
                {t('agents.enter_agent_url')}
              </Typography>
              <TextField
                fullWidth
                label={t('agents.agent_url')}
                variant="outlined"
                value={agentUrl}
                onChange={(e) => setAgentUrl(e.target.value)}
                error={!!errors.agentUrl}
                helperText={errors.agentUrl}
                disabled={isLoading}
                sx={{ mt: 2 }}
              />
            </TabPanel>

            {/* Title and Description */}
            <TabPanel value={activeStep} index={2}>
              <Typography variant="body1" gutterBottom>
                {t('agents.enter_title_description')}
              </Typography>
              <TextField
                fullWidth
                label={t('agents.title')}
                variant="outlined"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                disabled={isLoading}
                sx={{ mb: 2, mt: 2 }}
              />
              <TextField
                fullWidth
                label={t('agents.description')}
                variant="outlined"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!!errors.description}
                helperText={errors.description || t('agents.description_placeholder')}
                multiline
                rows={4}
                disabled={isLoading}
              />
            </TabPanel>

            {/* Authentication */}
            <TabPanel value={activeStep} index={3}>
              <Typography variant="body1" gutterBottom>
                {t('agents.select_authentication')}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="auth-type-label">{t('agents.authentication_type')}</InputLabel>
                <Select
                  labelId="auth-type-label"
                  value={authentication}
                  label={t('agents.authentication_type')}
                  onChange={(e) => setAuthentication(e.target.value)}
                  disabled={isLoading}
                >
                  <MenuItem value="none">{t('agents.auth_none')}</MenuItem>
                  <MenuItem value="bearer-token">{t('agents.auth_bearer')}</MenuItem>
                  <MenuItem value="header">{t('agents.auth_header')}</MenuItem>
                  <MenuItem value="basic-auth">{t('agents.auth_basic')}</MenuItem>
                </Select>
              </FormControl>

              {authentication === 'header' && (
                <TextField
                  fullWidth
                  label={t('agents.header_name')}
                  variant="outlined"
                  value={headerName}
                  onChange={(e) => setHeaderName(e.target.value)}
                  error={!!errors.headerName}
                  helperText={errors.headerName}
                  disabled={isLoading}
                  sx={{ mt: 2 }}
                />
              )}

              {authentication === 'basic-auth' && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label={t('agents.username')}
                    variant="outlined"
                    value={basicAuthLogin}
                    onChange={(e) => setBasicAuthLogin(e.target.value)}
                    error={!!errors.basicAuthLogin}
                    helperText={errors.basicAuthLogin}
                    disabled={isLoading}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label={t('agents.password')}
                    type="password"
                    variant="outlined"
                    value={basicAuthPassword}
                    onChange={(e) => setBasicAuthPassword(e.target.value)}
                    error={!!errors.basicAuthPassword}
                    helperText={errors.basicAuthPassword}
                    disabled={isLoading}
                  />
                </Box>
              )}
            </TabPanel>

            {/* Input JSON */}
            <TabPanel value={activeStep} index={4}>
              <Typography variant="body1" gutterBottom>
                {t('agents.input_json_desc')}
              </Typography>
              <Box sx={{ 
                height: '400px', 
                border: errors.inputJson ? '1px solid red' : undefined,
                mt: 2
              }}>
                <MonacoEditor
                  height="100%"
                  width="100%"
                  language="json"
                  theme="vs-dark"
                  value={inputJson}
                  onChange={(value) => {
                    setInputJson(value || '');
                    setIsInputValid(false); // Reset validation when input changes
                  }}
                  options={{
                    minimap: { enabled: false },
                    formatOnPaste: true,
                    formatOnType: true
                  }}
                />
              </Box>
              {errors.inputJson && (
                <FormHelperText error>{errors.inputJson}</FormHelperText>
              )}
              {isInputValid && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {t('agents.schema_valid')}
                </Alert>
              )}
            </TabPanel>

            {/* Output JSON */}
            <TabPanel value={activeStep} index={5}>
              <Typography variant="body1" gutterBottom>
                {t('agents.output_json_desc')}
              </Typography>
              <Box sx={{ 
                height: '400px', 
                border: errors.outputJson ? '1px solid red' : undefined,
                mt: 2
              }}>
                <MonacoEditor
                  height="100%"
                  width="100%"
                  language="json"
                  theme="vs-dark"
                  value={outputJson}
                  onChange={(value) => {
                    setOutputJson(value || '');
                    setIsOutputValid(false); // Reset validation when output changes
                  }}
                  options={{
                    minimap: { enabled: false },
                    formatOnPaste: true,
                    formatOnType: true
                  }}
                />
              </Box>
              {errors.outputJson && (
                <FormHelperText error>{errors.outputJson}</FormHelperText>
              )}
              {isOutputValid && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {t('agents.schema_valid')}
                </Alert>
              )}
            </TabPanel>

            {/* Icon Upload */}
            <TabPanel value={activeStep} index={6}>
              <Typography variant="body1" gutterBottom>
                {t('agents.upload_icon')}
              </Typography>
              <input
                accept="image/svg+xml"
                style={{ display: 'none' }}
                id="icon-upload-file"
                type="file"
                onChange={handleIconUpload}
                disabled={isLoading}
              />
              <label htmlFor="icon-upload-file">
                <Button
                  variant="contained"
                  component="span"
                  disabled={isLoading}
                  sx={{ mt: 2 }}
                >
                  {t('agents.select_icon')}
                </Button>
              </label>

              {iconPreview && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Box 
                    sx={{ 
                      width: '100px', 
                      height: '100px',
                      border: '1px solid #ccc',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: '50%'
                    }}
                    dangerouslySetInnerHTML={{ __html: iconPreview }}
                  />
                </Box>
              )}
            </TabPanel>

            {/* Operation Parameters */}
            <TabPanel value={activeStep} index={7}>
              <Typography variant="body1" gutterBottom>
                {t('agents.operation_params_desc')}
              </Typography>
              <TextField
                fullWidth
                label={t('agents.credits_per_run')}
                type="number"
                variant="outlined"
                value={creditsPerRun}
                onChange={(e) => setCreditsPerRun(parseInt(e.target.value) || 0)}
                error={!!errors.creditsPerRun}
                helperText={errors.creditsPerRun}
                disabled={isLoading}
                inputProps={{ min: 0 }}
                sx={{ mb: 2, mt: 2 }}
              />
              <TextField
                fullWidth
                label={t('agents.max_execution_time')}
                type="number"
                variant="outlined"
                value={maxExecutionTime}
                onChange={(e) => setMaxExecutionTime(parseInt(e.target.value) || 30)}
                error={!!errors.maxExecutionTime}
                helperText={errors.maxExecutionTime}
                disabled={isLoading}
                inputProps={{ min: 1 }}
              />

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleCreateWrapper}
                  disabled={isLoading}
                  sx={{ 
                    bgcolor: 'gold',
                    color: 'black',
                    '&:hover': {
                      bgcolor: '#e6c200',
                    }
                  }}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {t('agents.create_wrapper_button')}
                </Button>
              </Box>
            </TabPanel>

            {/* Navigation Buttons */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mt: 4,
              borderTop: 1,
              borderColor: 'divider',
              pt: 2
            }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={activeStep === 0 || isLoading}
              >
                {t('common.back')}
              </Button>

              {activeStep < 7 && (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  {t('common.next')}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};

export default AgentWrapperWizard;