import { ChangelogList } from "@/components/changelog/changelog-list";
import { execSync } from "child_process";

type GitCommit = {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  body: string;
  filesChanged: string[];
};

function getGitRemoteUrl(): string | null {
  try {
    const remoteUrl = execSync("git config --get remote.origin.url", {
      encoding: "utf-8",
      cwd: process.cwd(),
    }).trim();

    // Converter SSH para HTTPS se necessário
    if (remoteUrl.startsWith("git@")) {
      return remoteUrl
        .replace("git@github.com:", "https://github.com/")
        .replace("git@gitlab.com:", "https://gitlab.com/")
        .replace(".git", "");
    }

    return remoteUrl.replace(".git", "");
  } catch (error) {
    console.error("Error fetching git remote URL:", error);
    return null;
  }
}

function getGitCommits(): GitCommit[] {
  try {
    // Buscar os últimos 50 commits
    const commits = execSync(
      'git log -50 --pretty=format:"%H|%h|%an|%ad|%s|%b" --date=iso --name-only',
      {
        encoding: "utf-8",
        cwd: process.cwd(),
      }
    )
      .trim()
      .split("\n\n");

    return commits
      .map((commitBlock) => {
        const lines = commitBlock.split("\n");
        const [hash, shortHash, author, date, message, ...rest] =
          lines[0].split("|");

        // Separar body e arquivos
        const bodyLines: string[] = [];
        const filesChanged: string[] = [];
        let isBody = true;

        rest.forEach((line) => {
          if (line && !line.includes("/") && !line.includes(".")) {
            bodyLines.push(line);
          } else {
            isBody = false;
          }
        });

        lines.slice(1).forEach((line) => {
          if (line.trim()) {
            filesChanged.push(line.trim());
          }
        });

        return {
          hash,
          shortHash,
          author,
          date,
          message,
          body: bodyLines.join("\n").trim(),
          filesChanged: filesChanged.filter(
            (f) => f && !f.startsWith("git log")
          ),
        };
      })
      .filter((commit) => commit.hash && commit.message);
  } catch (error) {
    console.error("Error fetching git commits:", error);
    return [];
  }
}

export default async function ChangelogPage() {
  const commits = getGitCommits();
  const repoUrl = getGitRemoteUrl();

  return (
    <main>
      <ChangelogList commits={commits} repoUrl={repoUrl} />
    </main>
  );
}
