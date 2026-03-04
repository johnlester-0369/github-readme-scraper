# GitHub README Scraper

> Download every README.md from any GitHub user's repositories — including nested READMEs inside monorepos — with a single command.

## The Problem

You want to read, analyze, or archive the documentation from all of a GitHub user's public repositories. Doing this manually means opening every repo, navigating into every subdirectory, and copying files one by one. For users with dozens of repos — or repos with monorepo structures containing multiple READMEs — this is impractical.

This tool automates the entire process: one command, one username, everything downloaded and organized locally.

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/johnlester-0369/github-readme-scraper.git
cd github-readme-scraper
npm install

# 2. Run
node index.js johnlester-0369
```

That's it. README files appear in `./downloads/johnlester-0369/`.

## 📋 Prerequisites

- Node.js v14 or later
- Internet access to reach `api.github.com` and `raw.githubusercontent.com`
- No GitHub account or token required for public repositories

## 📁 Output Structure

Files are saved under `./downloads/` and preserve the exact directory structure from each repository:

```
downloads/
└── {username}/
    └── {repo-name}/
        ├── README.md                    ← root-level README
        ├── packages/
        │   └── server/
        │       └── README.md            ← monorepo package README
        └── docs/
            └── README.md               ← nested docs README
```

The `downloads/` directory is excluded from version control via `.gitignore`.

## ⚙️ How It Works

The scraper runs five operations in sequence for each repository:

1. **Fetch repository list** — calls `/users/{username}/repos` with `per_page=100`, sorted by last updated
2. **Get complete file tree** — calls `/repos/{username}/{repo}/git/trees/{branch}?recursive=1` to retrieve every file path in the repo in a single request
3. **Filter for READMEs** — selects all `blob` entries whose path ends with `readme.md` (case-insensitive), catching `README.md`, `Readme.md`, `README.MD`, and any other casing variation
4. **Download raw content** — constructs a `raw.githubusercontent.com` URL for each README and writes the file to `./downloads/{username}/{repo}/{original-path}`
5. **Branch fallback** — if the `main` branch returns a 404, the tool automatically retries with `master`, both for the tree fetch and the raw file download

## 📝 Notes & Limitations

| Topic | Detail |
|---|---|
| **Rate limiting** | Unauthenticated GitHub API requests are capped at 60 per hour. Each repository requires at least one API call for the file tree, so large accounts will hit this limit. |
| **Repositories per fetch** | The tool fetches up to 100 repositories per user in a single request. Users with more than 100 repos will have only their 100 most recently updated repos scraped. |
| **Tree size** | GitHub's API limits recursive tree responses to approximately 100,000 entries per repository. Extremely large monorepos may return a truncated tree. |
| **Private repositories** | No authentication is configured. Only public repositories are accessible. |
| **Branch support** | Only `main` and `master` branches are attempted. Repositories using other default branch names will be skipped with an error logged to the console. |

## 🤝 Contributing

Open an issue or pull request on GitHub.

## 📄 License

ISC