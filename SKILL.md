---
name: mahmoud-project
description: Mahmoud's project review. Takes an existing project (for example one built earlier with Claude or Codex), understands it fully, including its flow and every detail, and writes two SRS-like documents that are organized and easy to understand. The first covers the project idea, the technologies used and the full flow and user journey. The second details the frontend and the backend, the file structure and the APIs. Use ONLY when the user explicitly asks for this skill by name, for example "use mahmoud-project" or "استخدم سكيل mahmoud-project". Never start it on your own for any other request.
---

# mahmoud-project

Understand an existing project completely, then explain it in two organized, easy-to-understand documents, similar to an SRS.

## Rules

- **Read, don't guess.** Base every statement on the code you actually read: entry points, routes, components, services, models, configuration. When something cannot be confirmed from the code, say so clearly.
- **Do not change the project's code.** The only files you create are the two reports.
- **Code analysis skills are optional.** If a skill available in the current agent helps you analyze and understand the code, you may use it.
- **Language:** write the reports in the language the user uses.
- **Diagrams:** use Mermaid diagrams for the flow and the architecture wherever they make them easier to understand.

## Step 1: Understand the project

Go through the whole project before writing anything:

1. Find what the project is: its README, its dependency files (`package.json`, `requirements.txt`, `pubspec.yaml`, and so on) and its configuration.
2. Find the entry points of the frontend and the backend.
3. Follow the flow from each entry point: pages and screens, the actions a user takes, the requests they send, how the backend handles them, and what is stored or returned.
4. Note every API the project exposes or calls.

## Step 2: Report 1: Overview

Save it as `docs/mahmoud-project/01-overview.md` in the project, in this order:

1. **Project idea and general description.**
2. **Technologies used.**
3. **The flow and the full journey:** the complete user journey and how the parts of the project work together, from start to end.

## Step 3: Report 2: Technical details

Save it as `docs/mahmoud-project/02-technical.md` in the project. Detail the **frontend** and the **backend**, each with:

- **File structure:** the folders and important files, and what each one is for, so the user understands the project's structure.
- **APIs used:** each API, what it does, its inputs and outputs, and where it is called from.
- **Other technical details the project has:** for example the database, authentication, external services, configuration and environment variables, and how to run the project. Include only what actually exists in the project.

## Finish

Tell the user where the two reports were saved, with a short summary of each.
