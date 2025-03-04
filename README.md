## nginA 

Self-hostable agentic workflows.

![nginA Use Case](/docs/high-level-overview.jpg) 

### The Use Case

- Edit ![nginA Use Case](/docs/ngina-usecase.jpg) 

### The Frontend
This React/Vite/MUI frontend offers four main features
* the **Agent Catalog**
* the AI assisted **Agent Builder**
* the main component **Agent Operator** which manages n8n workflow instances
* an complementary **Accounting Agent** to control the costs

### Agent Catalog
![nginA Use Case](/docs/ngina-main1.jpg) 

### Agent Builder
![nginA Use Case](/docs/ngina-main2.jpg) 

### Agent Operator
![nginA Use Case](/docs/ngina-main3.jpg) 

### Accounting Agent
![nginA Use Case](/docs/ngina-main4.jpg) 

### The Authentication
All users must be authenticated with a valid JWT issued by Supabase.

### The Backend

[Python/FastAPI backend](https://github.com/BulloRosso/ngina-backend)