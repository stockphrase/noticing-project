// src/app/browse/page.tsx
// Public directory of all spots, filterable by term and searchable.

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import styles from "./browse.module.css";

interface SearchParams { term?: string; q?: string; }

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const terms = await prisma.term.findMany({
    where: { status: { in: ["active", "archived"] } },
    orderBy: { createdAt: "desc" },
  });

  const activeTerm = terms.find((t) => t.status === "active");
  const selectedTermId = searchParams.term ?? activeTerm?.id ?? terms[0]?.id;

  const spots = selectedTermId
    ? await prisma.spot.findMany({
        where: {
          termId: selectedTermId,
          ...(searchParams.q
            ? {
                OR: [
                  { name: { contains: searchParams.q } },
                  { user: { displayName: { contains: searchParams.q } } },
                ],
              }
            : {}),
        },
        include: {
          user: { select: { displayName: true, username: true } },
          _count: { select: { entries: true } },
          entries: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  function daysSince(d: Date) {
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  }

  return (
    <main className={styles.main}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>All spots</h1>
          <p className="small muted">
            {spots.length} observation site{spots.length !== 1 ? "s" : ""}
            {selectedTermId && terms.find((t) => t.id === selectedTermId)
              ? ` · ${terms.find((t) => t.id === selectedTermId)!.name}`
              : ""}
          </p>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          {/* Term filter */}
          {terms.length > 1 && (
            <div className={styles.termTabs}>
              {terms.map((t) => (
                <Link
                  key={t.id}
                  href={`/browse?term=${t.id}`}
                  className={`${styles.termTab} ${t.id === selectedTermId ? styles.termTabActive : ""}`}
                >
                  {t.name}
                  {t.status === "active" && (
                    <span className={styles.activeDot} />
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Search */}
          <form method="GET" action="/browse" className={styles.searchForm}>
            {selectedTermId && (
              <input type="hidden" name="term" value={selectedTermId} />
            )}
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Search spots or observers…"
              style={{ fontSize: 13, maxWidth: 260 }}
            />
          </form>
        </div>

        {/* Grid */}
        {spots.length === 0 ? (
          <p className="small muted" style={{ paddingTop: 40 }}>
            {terms.length === 0
              ? "No terms have started yet."
              : searchParams.q
              ? "No spots match that search."
              : "No spots claimed yet this term."}
          </p>
        ) : (
          <div className={styles.grid}>
            {spots.map((spot) => {
              const lastEntry = spot.entries[0];
              return (
                <Link
                  key={spot.id}
                  href={`/spot/${spot.id}`}
                  className={styles.card}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.cardDot} />
                    <span
                      className={`${styles.entryCount} tiny mono muted`}
                    >
                      {spot._count.entries} entries
                    </span>
                  </div>
                  <h2 className={styles.spotName}>{spot.name}</h2>
                  <div className={styles.cardMeta}>
                    <span className="small muted">{spot.user.displayName}</span>
                    {lastEntry && (
                      <span className="tiny faint">
                        {daysSince(lastEntry.createdAt)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
