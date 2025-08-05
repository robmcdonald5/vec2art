# Agent System Documentation

This directory contains specialized agents for the AI Creative Writing Assistant project. This document provides local guidance specific to the agent system implementation.

## Agent Invocation Methods

As of Claude Code v1.0.62+, agents are invoked using the **@-mention syntax**:
- Type `@` followed by the agent name (e.g., `@rust-developer`)
- Typeahead support helps you find available agents
- Each invocation is stateless and independent

## Available Commands
- `/agents` - View and manage all available agents
- `@agent-generator` - Create new specialized agents

## Agent File Structure

Each agent file must include:
```yaml
---
name: technology-type
description: Clear description with 3 usage examples
tools: List of available tools
model: opus (developers) or sonnet (researchers)
color: red (developers) or green (researchers)
---
```

## Current Agents

### Developer Agents (Code Implementation)
- 

### Research Agents (Documentation & Best Practices)
- 

### Special Agents
- `agent-generator` - Creates new specialized agents

## Agent Creation Guidelines

When creating new agents with `@agent-generator`:
1. Ensure the technology isn't already covered
2. Follow naming convention: `[technology]-[developer|researcher]`
3. Include realistic, contextual examples
4. Define 5-7 specific capabilities
5. Maintain template consistency

## Integration with Main Session

The main Claude session acts as the "General Contractor":
- Coordinates agent outputs
- Maintains full project context
- Handles cross-cutting concerns
- Reviews agent-generated code

Agents handle focused, specialized tasks while the main session maintains the big picture.

## Model Selection

Agents can specify custom models in their frontmatter:
- Developer agents default to `opus` for code generation
- Research agents default to `sonnet` for information gathering
- Custom models can be specified as needed

## Best Practices

1. **Use agents for focused tasks**: Agents excel at specific, well-defined tasks
2. **Main session for integration**: Let the main session handle multi-file changes
3. **Review agent output**: Always review agent-generated code in the main session
4. **Avoid agent overlap**: Check existing agents before creating new ones
5. **Maintain consistency**: Follow established patterns and templates