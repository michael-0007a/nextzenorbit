"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/career/section-header";
import type { InterviewQuestion } from "@/types/domain";
import { useInterviewFilter } from "@/hooks/use-interview-filter";

const difficultyVariant: Record<string, "success" | "warning" | "error" | "default"> = {
  easy: "success",
  medium: "warning",
  hard: "error",
};

export interface InterviewSectionProps {
  questions: InterviewQuestion[];
}

export function InterviewSection({ questions }: InterviewSectionProps) {
  const {
    query,
    setQuery,
    topic,
    setTopic,
    difficulty,
    setDifficulty,
    topics,
    filtered,
  } = useInterviewFilter(questions);

  const [openId, setOpenId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const difficultyOptions = ["All", "easy", "medium", "hard"];
  const INITIAL_COUNT = 5;
  const displayedQuestions = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);

  return (
    <section id="interview" className="space-y-6">
      <SectionHeader
        title="Interview questions"
        description="Filter by topic or difficulty and expand answers for quick revision."
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search questions or answers"
          leftAddon={<Search className="h-4 w-4" />}
        />
        <div className="flex flex-wrap items-center gap-2">
          {difficultyOptions.map((item) => (
            <button
              key={item}
              onClick={() => setDifficulty(item)}
              className={
                item === difficulty
                  ? "rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-xs font-semibold text-primary"
                  : "rounded-full border border-border/70 bg-white/5 px-4 py-2 text-xs font-semibold text-text-secondary hover:border-primary/30 hover:text-foreground"
              }
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {topics.map((item) => (
          <button
            key={item}
            onClick={() => setTopic(item)}
            className={
              item === topic
                ? "rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary"
                : "rounded-full border border-border/70 bg-white/5 px-3 py-1 text-xs font-semibold text-text-secondary hover:border-primary/30 hover:text-foreground"
            }
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-white/5 p-10 text-center">
          <p className="text-sm text-text-secondary">
            No questions match your filters yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {displayedQuestions.map((question) => {
              const isOpen = openId === question.id;
              return (
                <Card
                  key={question.id}
                  className="border border-border/60 bg-surface/40 transition-all duration-200 hover:border-border/80"
                >
                  <CardBody className="space-y-4">
                    <button
                      onClick={() => setOpenId(isOpen ? null : question.id)}
                      className="flex w-full items-start justify-between gap-4 text-left"
                      type="button"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={difficultyVariant[question.difficulty ?? ""] ?? "default"}>
                            {question.difficulty ?? "Unknown"}
                          </Badge>
                          {question.topic && (
                            <Badge variant="info" size="sm">
                              {question.topic}
                            </Badge>
                          )}
                          {question.company && (
                            <Badge variant="primary" size="sm">
                              {question.company}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-foreground">
                          {question.question}
                        </h3>
                      </div>
                      <ChevronDown
                        className={`mt-1 h-4 w-4 text-text-secondary transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {question.answer}
                      </p>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {filtered.length > INITIAL_COUNT && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/15 px-6 py-2.5 text-xs font-semibold text-primary transition-all duration-200 cursor-pointer shadow-sm hover:shadow-primary/5 hover:border-primary/50"
                type="button"
              >
                {showAll ? "Show Less" : `Show More (${filtered.length - INITIAL_COUNT} more)`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
