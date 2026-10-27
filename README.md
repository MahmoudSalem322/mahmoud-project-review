# mahmoud-project

An agent skill that reviews an existing project, understands it fully, and explains it in two organized, SRS-like documents. It works in both **Claude Code** and **Codex**.

[العربية](#بالعربي)

## What you get

The skill reads the project's code (it does not change it) and writes two reports inside the project:

**`docs/mahmoud-project/01-overview.md`**

1. The project idea and a general description
2. The technologies used
3. The flow and the full user journey

**`docs/mahmoud-project/02-technical.md`**

For the frontend and the backend:

- The file structure, and what each folder and important file is for
- The APIs used: what each does, its inputs and outputs, and where it is called
- Other technical details the project actually has: database, authentication, external services, configuration, how to run it

Flows and architecture include Mermaid diagrams where they help. Reports are written in the language you use.

## Install

**Claude Code** (all projects):

```bash
git clone https://github.com/MahmoudSalem322/mahmoud-project-review ~/.claude/skills/mahmoud-project
```

**Codex** (all projects):

```bash
git clone https://github.com/MahmoudSalem322/mahmoud-project-review ~/.agents/skills/mahmoud-project
```

Restart the agent after installing.

## Use

Open the agent in the project's folder. The skill runs only when you ask for it by name:

```text
use mahmoud-project
```

Shortcuts: `/mahmoud-project` in Claude Code, `$mahmoud-project` in Codex.

---

## بالعربي

سكيل بتفهم أي مشروع موجود بالكامل، وبتشرحه بوثيقتين منظمتين ومفهومتين شبيهتين بالـ SRS. بتشتغل على **Claude Code** و **Codex**، وما بتعدّل على كود المشروع.

- **التقرير الأول** (`01-overview.md`): فكرة المشروع ووصف عام، والتقنيات المستخدمة، والفلو والرحلة كاملة.
- **التقرير الثاني** (`02-technical.md`): تفاصيل الفرونت والباك، وبنية الملفات، والـ APIs، وباقي التفاصيل التقنية الموجودة بالمشروع.

**التشغيل:** افتح الوكيل بمجلد المشروع وقول "استخدم سكيل mahmoud-project".

## License

MIT. See [LICENSE](LICENSE).
