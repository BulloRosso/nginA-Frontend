# nginA 

Self-hostable agentic workflows.

![nginA Use Case](/docs/high-level-overview.jpg) 

nginA is based on **n8n** (open source workflow engine for technical teams) and **Supabase** (data storage as a service).

One of the main reasons for building nginA was the requirement for the solution to be **self-hostable** and open source.

### The Use Case

The main use of nginA provide a user interface for AI agents (you can use non-AI services as well).

AI agents are implementations of SOPs (Standard Operating Procedures) and must be:
* Reliable
* Auditable/Observable
* Billable
* Secure 

![nginA Use Case](/docs/ngina-usecase.jpg) 

nginA has two main setups to deliver AI workflows, content or chatbots to other people.

### Provide AI workflows internal users

Key users design agentic workflows for their department and publish dashboards
or push automations for internal users.

Internal users must authenticate before accessing dashboards.

![nginA Use Case 1](/docs/use-case-1.jpg) 

### Provide AI workflows for customers

The agency's developer(s) design agentic workflows for customers and publish dashboards
or push automations.

Customers must authenticate before accessing dashboards.

![nginA Use Case 1](/docs/use-case-2.jpg) 

## The Frontend
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

### Dashboards (Self-service UI)
![nginA Use Case](/docs/ngina-main5.jpg) 

### The Authentication
All users must be authenticated with a valid JWT issued by Supabase.

![Login screen](/docs/login-screen.jpg)

Depending on the use case of your company (external/internal) many more authentication methods can be supported (e. g. social login).

### Multi language support
nginA is prepared to support any language:

![Language selector](/docs/multi-lang.jpg) 

## The Backend

[Python/FastAPI backend](https://github.com/BulloRosso/ngina-backend)