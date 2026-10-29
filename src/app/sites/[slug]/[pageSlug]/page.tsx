import { Suspense } from "react";

import { PublishedSitePage } from "@/components/published-site-page";

export default function PublishedSubpage({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <PublishedSitePage params={params} />
    </Suspense>
  );
}
