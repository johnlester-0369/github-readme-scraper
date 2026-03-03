import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// GitHub API endpoints
const GITHUB_API = 'https://api.github.com';
const RAW_CONTENT = 'https://raw.githubusercontent.com';

/**
 * Fetch all repositories for a given username
 * Handles pagination automatically (max 100 repos per page)
 */
async function fetchUserRepos(username) {
    try {
        const response = await axios.get(`${GITHUB_API}/users/${username}/repos`, {
            params: {
                per_page: 100,
                sort: 'updated'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch repos for ${username}:`, error.message);
        throw error;
    }
}

/**
 * Fetch the complete git tree for a repository to find all README files
 * Recursive=1 gives us all files in the repo regardless of depth
 */
async function fetchRepoTree(username, repo, branch = 'main') {
    try {
        const response = await axios.get(
            `${GITHUB_API}/repos/${username}/${repo}/git/trees/${branch}?recursive=1`
        );
        return response.data.tree;
    } catch (error) {
        // Fallback to 'master' branch if 'main' fails
        if (branch === 'main' && error.response?.status === 404) {
            console.log(`Branch 'main' not found for ${repo}, trying 'master'...`);
            return fetchRepoTree(username, repo, 'master');
        }
        console.error(`Failed to fetch tree for ${repo}:`, error.message);
        return []; // Return empty array so other repos continue
    }
}

/**
 * Ensure download directory exists, create it recursively if needed
 */
async function ensureDownloadPath(username, repo, fileDir) {
    const fullPath = path.join('downloads', username, repo, fileDir);
    await fs.mkdir(fullPath, { recursive: true });
    return fullPath;
}

/**
 * Download a README file from raw GitHub content URL
 * Uses path segments after the repo name to preserve monorepo structure
 */
async function downloadReadme(username, repo, filePath) {
    try {
        // filePath is the full path from git tree (e.g., "packages/server/README.md")
        // Extract directory and filename
        const parsedPath = path.parse(filePath);
        const fileDir = parsedPath.dir;
        const fileName = parsedPath.base;

        // Create directory structure under downloads/username/repo/path
        const downloadDir = await ensureDownloadPath(username, repo, fileDir);
        const outputPath = path.join(downloadDir, fileName);

        // Construct raw content URL
        const rawUrl = `${RAW_CONTENT}/${username}/${repo}/main/${filePath}`;

        console.log(`Downloading: ${rawUrl}`);
        const response = await axios.get(rawUrl, { responseType: 'text' });

        await fs.writeFile(outputPath, response.data);
        console.log(`✓ Saved to: ${outputPath}`);

        return { success: true, path: outputPath };
    } catch (error) {
        // Try with 'master' branch if 'main' fails
        if (error.response?.status === 404 && !filePath.includes('master')) {
            try {
                const masterUrl = `${RAW_CONTENT}/${username}/${repo}/master/${filePath}`;
                console.log(`Retrying with master branch: ${masterUrl}`);
                const response = await axios.get(masterUrl, { responseType: 'text' });

                const parsedPath = path.parse(filePath);
                const downloadDir = await ensureDownloadPath(username, repo, parsedPath.dir);
                const outputPath = path.join(downloadDir, parsedPath.base);

                await fs.writeFile(outputPath, response.data);
                console.log(`✓ Saved to: ${outputPath}`);
                return { success: true, path: outputPath };
            } catch (masterError) {
                console.error(`✗ Failed to download ${filePath} from ${repo}:`, masterError.message);
                return { success: false, error: masterError.message };
            }
        }

        console.error(`✗ Failed to download ${filePath} from ${repo}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Main orchestrator:
 * 1. Get username from command line arguments
 * 2. Fetch all user repos
 * 3. For each repo, get complete file tree
 * 4. Find and download all README.md files (case-insensitive)
 */
async function main() {
    const username = process.argv[2];

    if (!username) {
        console.error('Usage: node index.js <github-username>');
        process.exit(1);
    }

    console.log(`🔍 Fetching repositories for user: ${username}`);

    try {
        const repos = await fetchUserRepos(username);
        console.log(`Found ${repos.length} repositories\n`);

        let totalReadmes = 0;
        let successCount = 0;

        for (const repo of repos) {
            console.log(`\n📁 Processing: ${repo.name}`);

            const tree = await fetchRepoTree(username, repo.name);

            // Find all files named README.md (case-insensitive)
            const readmeFiles = tree.filter(item =>
                item.type === 'blob' &&
                item.path.toLowerCase().endsWith('readme.md')
            );

            if (readmeFiles.length === 0) {
                console.log('  No README.md files found');
                continue;
            }

            console.log(`  Found ${readmeFiles.length} README file(s)`);
            totalReadmes += readmeFiles.length;

            for (const file of readmeFiles) {
                const result = await downloadReadme(username, repo.name, file.path);
                if (result.success) successCount++;
            }
        }

        console.log(`\n✅ Complete! Downloaded ${successCount}/${totalReadmes} README files to ./downloads/${username}/`);
    } catch (error) {
        console.error('\n❌ Scraping failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
main();