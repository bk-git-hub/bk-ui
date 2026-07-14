import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { getPageMetadata, pageMetadataEntries } from "./page-metadata.config";
import PageMetadata from "./page-metadata";

function renderMetadata(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <PageMetadata />
    </MemoryRouter>,
  );
}

describe("PageMetadata", () => {
  beforeEach(() => {
    document.head.innerHTML = "<title></title>";
  });

  it("defines unique metadata for every shareable page", () => {
    const paths = new Set(pageMetadataEntries.map((entry) => entry.path));

    expect(paths.size).toBe(pageMetadataEntries.length);
    expect(pageMetadataEntries).toHaveLength(13);
    pageMetadataEntries.forEach((entry) => {
      expect(entry.path).toMatch(/^\//);
      expect(entry.title).toContain("BK UI");
      expect(entry.description.length).toBeGreaterThan(40);
    });
  });

  it("applies component-specific metadata for a route", async () => {
    renderMetadata("/components/react-pod");

    await waitFor(() => {
      expect(document.title).toBe("ReactPod | BK UI");
    });
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://bk-ui.vercel.app/components/react-pod",
    );
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      expect.stringContaining("Retro click-wheel React controller"),
    );
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "ReactPod | BK UI",
    );
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "https://bk-ui.vercel.app/components/react-pod",
    );
    expect(document.querySelector('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
  });

  it("normalizes trailing slashes and falls back to home metadata", () => {
    expect(getPageMetadata("/components/coverflow/")).toMatchObject({
      path: "/components/coverflow",
      title: "Coverflow | BK UI",
    });
    expect(getPageMetadata("/missing")).toMatchObject({
      path: "/",
      title: "BK UI - Interactive React Components",
    });
  });
});
