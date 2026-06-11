"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { topicNavLinks } from "../lib/topicPages";

export function TopicNav() {
  const pathname = usePathname();

  return (
    <nav className="topic-nav" aria-label="Care topics">
      {topicNavLinks.map((topic) => (
        <Link className={pathname === topic.href ? "active" : undefined} key={topic.href} href={topic.href}>
          {topic.label}
        </Link>
      ))}
    </nav>
  );
}
