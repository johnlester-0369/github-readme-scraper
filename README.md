# GitHub README Scraper

A Node.js tool that downloads all README.md files from a GitHub user's repositories, preserving monorepo directory structures.

## 🚀 Features

- Fetches all repositories for any GitHub username
- Recursively scans each repository's file tree
- Finds all README.md files (case-insensitive)
- Preserves original directory structure (great for monorepos)
- Automatically falls back from `main` to `master` branch
- Saves files locally with clear organization

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- A GitHub username to scrape (no authentication required for public repos)

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/johnlester-0369/github-readme-scraper.git
cd github-readme-scraper

# Install dependencies
npm install
```

## 🎯 Usage

```bash
node index.js <github-username>
```

**Example:**
```bash
node index.js johnlester-0369
```

This will:
1. Fetch all repositories for `johnlester-0369`
2. Scan each repo for README.md files
3. Download them to `./downloads/johnlester-0369/` preserving structure

## 📁 Output Structure

Downloads are organized exactly as they appear in the repository:

```
downloads/
└── {username}/
    └── {repo-name}/
        ├── README.md                          # Root README
        ├── packages/
        │   └── server/
        │       └── README.md                   # Monorepo package README
        └── docs/
            └── README.md                        # Documentation README
```

## ⚙️ How It Works

1. **Fetch Repositories** — Uses GitHub API to get all user repos (`/users/{username}/repos`)
2. **Get File Tree** — For each repo, requests the complete git tree with `?recursive=1`
3. **Find READMEs** — Filters for files ending in `readme.md` (case-insensitive)
4. **Download** — Constructs raw content URLs and saves files with original paths
5. **Branch Fallback** — Tries `main` first, then `master` if 404

## 📝 Notes

- Rate limiting: Unauthenticated requests are limited to 60/hr
- Large repos: GitHub API limits tree responses (~100k entries max)
- README matching: Case-insensitive (catches `Readme.md`, `README.MD`, etc.)
- Empty directories: Not created if no READMEs found in a repo

## 📄 License

ISC

## 🤝 Contributing

Feel free to open issues or PRs for improvements!