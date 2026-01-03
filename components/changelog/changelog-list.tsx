"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  RiGitCommitLine,
  RiUserLine,
  RiCalendarLine,
  RiFileList2Line,
} from "@remixicon/react";

type GitCommit = {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  body: string;
  filesChanged: string[];
};

type ChangelogListProps = {
  commits: GitCommit[];
  repoUrl: string | null;
};

type CommitType = {
  type: string;
  scope?: string;
  description: string;
};

function parseCommitMessage(message: string): CommitType {
  const conventionalPattern = /^(\w+)(?:$$([^)]+)$$)?:\s*(.+)$/;
  const match = message.match(conventionalPattern);

  if (match) {
    return {
      type: match[1],
      scope: match[2],
      description: match[3],
    };
  }

  return {
    type: "chore",
    description: message,
  };
}

function getCommitTypeColor(type: string): string {
  const colors: Record<string, string> = {
    feat: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    fix: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    docs: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    style:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    refactor:
      "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    perf: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    test: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
    chore: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  };

  return colors[type] || colors.chore;
}

export function ChangelogList({ commits, repoUrl }: ChangelogListProps) {
  if (!commits || commits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhum commit encontrado no repositório
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {commits.map((commit) => (
        <CommitCard key={commit.hash} commit={commit} repoUrl={repoUrl} />
      ))}
    </div>
  );
}

function CommitCard({
  commit,
  repoUrl,
}: {
  commit: GitCommit;
  repoUrl: string | null;
}) {
  const commitDate = new Date(commit.date);
  const relativeTime = formatDistanceToNow(commitDate, {
    addSuffix: true,
    locale: ptBR,
  });

  const commitUrl = repoUrl ? `${repoUrl}/commit/${commit.hash}` : null;
  const parsed = parseCommitMessage(commit.message);

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`${getCommitTypeColor(parsed.type)} py-1`}
          >
            {parsed.type}
          </Badge>
          {parsed.scope && (
            <Badge
              variant="outline"
              className="text-muted-foreground border-muted-foreground/30 text-xs py-0"
            >
              {parsed.scope}
            </Badge>
          )}
          <span className="font-bold text-lg flex-1 min-w-0 first-letter:uppercase">
            {parsed.description}
          </span>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
          {commitUrl ? (
            <a
              href={commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline transition-colors font-mono flex items-center gap-1"
            >
              <RiGitCommitLine className="size-4" />
              {commit.shortHash}
            </a>
          ) : (
            <span className="font-mono flex items-center gap-1">
              <RiGitCommitLine className="size-3" />
              {commit.shortHash}
            </span>
          )}
          <span className="flex items-center gap-1">
            <RiUserLine className="size-3" />
            {commit.author}
          </span>
          <span className="flex items-center gap-1">
            <RiCalendarLine className="size-3" />
            {relativeTime}
          </span>
        </div>
      </CardHeader>

      {commit.body && (
        <CardContent className="text-muted-foreground leading-relaxed">
          {commit.body}
        </CardContent>
      )}

      {commit.filesChanged.length > 0 && (
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="files-changed" className="border-0">
              <AccordionTrigger className="py-0 text-xs text-muted-foreground hover:text-foreground hover:no-underline">
                <div className="flex items-center gap-1.5">
                  <RiFileList2Line className="size-3.5" />
                  <span>
                    {commit.filesChanged.length} arquivo
                    {commit.filesChanged.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-0">
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {commit.filesChanged.map((file, index) => (
                    <li
                      key={index}
                      className="text-xs font-mono bg-muted rounded px-2 py-1 text-muted-foreground break-all"
                    >
                      {file}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      )}
    </Card>
  );
}
