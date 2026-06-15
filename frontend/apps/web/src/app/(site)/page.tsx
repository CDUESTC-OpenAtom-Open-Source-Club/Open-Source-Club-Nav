import { Suspense } from "react";
import HomePageClient from "./HomePageClient";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export default function Page() {
  return (
    <>
      <div className="sr-only">
        <h1>{SITE_TITLE}</h1>
        <p>{SITE_DESCRIPTION}</p>
      </div>
      <Suspense fallback={null}>
        <HomePageClient />
      </Suspense>
    </>
  );
}
