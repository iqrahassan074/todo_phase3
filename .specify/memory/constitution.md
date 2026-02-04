# Textbook Chatbot Constitution

## Core Principles

### I. Spec-First, Agentic Workflow
Follow Spec → Plan → Tasks → Implement via Claude Code. No manual coding. All development follows the agentic workflow for maximum automation and consistency.

### II. Stateless Server Design
Every request reconstructs conversation state from DB. Server memory is never trusted. This ensures reliability and scalability across deployments.

### III. Tool-Driven AI Operations
All task CRUD and queries go through MCP tools. Agent cannot bypass tools. This maintains data integrity and auditability of all operations.

### IV. Deterministic & Auditable System
Persist all messages, conversations, and tool calls. Complete audit trail for debugging, compliance, and system analysis.

### V. Minimal Surface Area
Single chat endpoint; MCP encapsulates domain logic. Reduces attack surface and simplifies maintenance while maintaining functionality.

### VI. Graceful Failure Handling
Friendly confirmations and error handling for all operations. Ensure positive user experience even during system failures.

### VII. Security & Authentication
User identity via Better Auth; DB persistence via Neon PostgreSQL. Industry-standard security practices for user data protection.

### VIII. Containerized Deployment
System is fully Dockerized; stateless design enables Kubernetes orchestration. Ensures consistent deployment across environments.

### IX. Scalability by Design
Stateless server + DB + containerized deployment ensures horizontal scaling. System designed to handle increased load efficiently.

## Technology Stack Requirements

- **Backend**: Node.js/TypeScript with Hono or similar lightweight framework
- **Database**: Neon PostgreSQL for persistence
- **Authentication**: Better Auth for secure user identity
- **AI Integration**: OpenAI-compatible API for chat functionality
- **MCP Tools**: Proper integration with Model Context Protocol tools
- **Containerization**: Docker for deployment consistency
- **Frontend**: Modern React/Vue.js interface with real-time chat capabilities

## Development Workflow

- All changes must follow Spec → Plan → Tasks → Implement workflow
- Automated testing required for all functionality
- Code reviews must verify constitutional compliance
- PRs must include updated documentation
- Security scanning required before merge
- Performance benchmarks must pass before deployment

## Governance

Constitution supersedes all other practices. Amendments require documentation, approval, and migration plan. All PRs/reviews must verify compliance. Complexity must be justified with clear benefits.

**Version**: 1.0.0 | **Ratified**: 2026-02-02 | **Last Amended**: 2026-02-02
