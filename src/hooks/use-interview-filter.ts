"use client";

import { useMemo, useState } from "react";
import type { InterviewQuestion } from "@/types/domain";

export type InterviewFilterState = {
  query: string;
  topic: string;
  difficulty: string;
};

export function useInterviewFilter(questions: InterviewQuestion[]) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  const topics = useMemo(() => {
    const unique = new Set(
      questions.map((question) => question.topic).filter((t): t is string => Boolean(t))
    );
    return ["All", ...Array.from(unique)];
  }, [questions]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return questions.filter((question) => {
      const matchesQuery = normalizedQuery
        ? question.question.toLowerCase().includes(normalizedQuery) ||
          question.answer.toLowerCase().includes(normalizedQuery)
        : true;

      const matchesTopic =
        topic === "All" || question.topic === topic;

      const matchesDifficulty =
        difficulty === "All" || question.difficulty === difficulty;

      return matchesQuery && matchesTopic && matchesDifficulty;
    });
  }, [difficulty, query, questions, topic]);

  return {
    query,
    setQuery,
    topic,
    setTopic,
    difficulty,
    setDifficulty,
    topics,
    filtered,
  };
}
