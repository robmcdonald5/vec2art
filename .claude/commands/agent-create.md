# Agent Create Workflow

This command streamlines the agent creation process by providing a template for efficiently invoking the agent-generator system.

## Usage Pattern

When the user requests agent creation, follow this streamlined workflow:

### 1. Identify Agent Requirements
- **Agent Type**: developer (code implementation) or researcher (documentation/best practices)
- **Technology**: The specific framework/library (e.g., pydantic, fastapi, pytest)
- **Use Case**: What repetitive tasks will this agent handle?

### 2. Streamlined Invocation Template

Use the Task tool with agent-generator using this efficient pattern:

```
I am the agent-generator agent. Create a new [TECHNOLOGY]-[TYPE] agent following the [TYPE] agent template.

This agent should specialize in [TECHNOLOGY]-related tasks for the AI Creative Writing Assistant project.

IMPORTANT: This is a Claude Code agent that belongs in .claude/agents/ directory, NOT in backend/src/ai_writer/agents/ (which is for application agents like LoreMaster).

Requirements:
- Name: [TECHNOLOGY]-[TYPE] 
- Type: [TYPE] agent (model: [opus for developer, sonnet for researcher], color: [red for developer, green for researcher])
- Focus: [TECHNOLOGY] [development patterns for developer, research and documentation for researcher]
- Use the agent-template-[TYPE].md as base located in .claude/agents/
- Create 3 realistic examples for the description
- Define 5-7 specific [TECHNOLOGY] capabilities
- Include [development principles for developer, search strategies for researcher] specific to [TECHNOLOGY]
- Customize output format for [TECHNOLOGY] [implementation for developer, research for researcher]
- Follow all quality checklist requirements
- SAVE FILE TO: .claude/agents/[TECHNOLOGY]-[TYPE].md

Please create the complete agent markdown file in the correct .claude/agents/ location.
```

### 3. Key Benefits
- **No Discovery Overhead**: Direct path to agent-generator (`.claude/agents/agent-generator.md`)
- **Consistent Parameters**: Template ensures all required parameters are included
- **Quality Assurance**: Built-in checklist validation
- **Template Adherence**: Follows established patterns from agent-template-developer.md and agent-template-researcher.md

This eliminates the token-expensive discovery phase and provides immediate, efficient agent creation.