# Agent Creation Guide

This guide explains how to create new specialized agents for the AI Creative Writing Assistant project using the standardized templates.

## Agent Types

There are two types of agents in this project:

### 1. Research Agents
- **Purpose**: Find authoritative information, best practices, and documentation
- **Model**: `sonnet` (optimized for research tasks)
- **Color**: `green`
- **Tools**: `Read, Write, WebFetch, WebSearch, TodoWrite`
- **Template**: `agent-template-researcher.md`

### 2. Developer Agents
- **Purpose**: Write, review, and refactor code with emphasis on best practices
- **Model**: `opus` (optimized for complex coding tasks)
- **Color**: `red`
- **Tools**: `Bash, Glob, Grep, Read, Edit, MultiEdit, Write, TodoWrite`
- **Template**: `agent-template-developer.md`

## Creating a New Agent

### Step 1: Choose the Correct Template

Determine whether your agent is a researcher or developer:
- **Research Agent**: If the agent primarily searches for information, documentation, or best practices
- **Developer Agent**: If the agent primarily writes, modifies, or reviews code

### Step 2: Copy the Template

Copy the appropriate template file:
```bash
# For a research agent
cp agent-template-researcher.md [technology]-researcher.md

# For a developer agent
cp agent-template-developer.md [technology]-developer.md
```

### Step 3: Fill in the Template

Replace all placeholders (marked with `[brackets]` or `[CAPS]`) with specific information:

#### Header Section
1. **name**: Must follow the pattern `[technology]-researcher` or `[technology]-developer`
2. **description**: Brief description starting with "Use this agent when..."
3. **examples**: Provide 2-3 realistic usage examples with context
4. **tools**: Keep the default tools for the agent type
5. **model**: Keep `sonnet` for researchers, `opus` for developers
6. **color**: Keep `green` for researchers, `red` for developers

#### Content Sections

**For Research Agents:**
1. **Purpose**: 1-2 sentences describing the agent's research focus
2. **Core Capabilities**: 5-6 bullet points of research expertise
3. **Research Methodology**: Define source hierarchy and search strategies
4. **Output Format**: Keep the 5 standard sections
5. **Constraints**: Keep the standard research constraints

**For Developer Agents:**
1. **Purpose**: 1-2 sentences describing the agent's development expertise
2. **Core Expertise**: 5-7 bullet points of technical capabilities
3. **Development Principles**: 3-5 key principles with explanations
4. **Output Format**: Keep the 5 standard sections
5. **Constraints**: Keep the standard developer constraints

## Naming Conventions

### File Names
- Research agents: `[technology]-researcher.md`
- Developer agents: `[technology]-developer.md`
- Use lowercase with hyphens (kebab-case)
- Examples: `react-developer.md`, `aws-researcher.md`

### Agent Names (in YAML header)
- Must match the file name without the `.md` extension
- Examples: `react-developer`, `aws-researcher`

## Content Guidelines

### Writing Style
- **Purpose Section**: Be concise (2-3 sentences max)
- **Capabilities/Expertise**: Use action verbs, be specific
- **Principles**: Include the "why" not just the "what"
- **Output Format**: Keep subsections consistent with template
- **Constraints**: Don't modify the standard constraints

### Examples in Description
Each agent needs 2-3 examples in the description field:
```yaml
description: Use this agent when... Examples: 
  <example>Context: [situation]. 
  user: '[user question]' 
  assistant: '[how assistant would invoke agent]'
  <commentary>[optional explanation]</commentary></example>
```

## Quality Checklist

Before finalizing a new agent, verify:

- [ ] Naming follows the `[technology]-researcher` or `[technology]-developer` pattern
- [ ] All placeholders have been replaced with specific content
- [ ] Examples are realistic and demonstrate clear use cases
- [ ] Core capabilities/expertise are specific to the technology
- [ ] Principles (for developers) are actionable and technology-specific
- [ ] Search strategies (for researchers) include actual search patterns
- [ ] Output format sections haven't been altered from template
- [ ] Constraints section remains unchanged from template
- [ ] Model and color match the agent type
- [ ] Tools list matches the agent type

## Common Pitfalls to Avoid

1. **Don't mix agent types**: Keep research and development concerns separate
2. **Don't over-customize output format**: Maintain consistency across agents
3. **Don't change constraints**: These ensure agents behave predictably
4. **Don't forget examples**: They help the primary agent understand when to invoke
5. **Don't be too verbose**: Keep descriptions concise and actionable

## Testing Your Agent

After creating a new agent:

1. **Validate the YAML header**: Ensure it parses correctly
2. **Test invocation**: Try scenarios from your examples
3. **Check output format**: Verify the agent follows the structure
4. **Review consistency**: Compare with existing agents of the same type

## Future Agent Ideas

Consider creating agents for:
- **Researchers**: graphql-researcher, docker-researcher, kubernetes-researcher
- **Developers**: react-developer, vue-developer, fastapi-developer, django-developer

## Maintenance

When updating agents:
1. Always update all agents of the same type together for consistency
2. Document any structural changes in this guide
3. Update the templates if making systematic changes
4. Consider backwards compatibility with existing agent invocations