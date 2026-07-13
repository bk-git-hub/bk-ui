// @vitest-environment node

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as clientEntry from "./client";
import * as coreEntry from "./index";

describe("Coverflow public entries", () => {
  it("re-exports the same core implementation from the client boundary", () => {
    expect(clientEntry.Coverflow).toBe(coreEntry.Coverflow);
    expect(clientEntry.CoverflowItem).toBe(coreEntry.CoverflowItem);
    expect(clientEntry.LazyImage).toBe(coreEntry.LazyImage);
  });

  it("renders without browser globals during SSR", () => {
    const markup = renderToString(
      <coreEntry.Coverflow aria-label="Album covers" itemSize={320}>
        <coreEntry.CoverflowItem
          backContent={
            <ol>
              <li>Track one</li>
            </ol>
          }
          flipLabel="Toggle album details"
        >
          <span>Album cover</span>
        </coreEntry.CoverflowItem>
      </coreEntry.Coverflow>,
    );

    expect(markup).toContain('data-slot="coverflow"');
    expect(markup).toContain('aria-label="Album covers"');
    expect(markup).toContain('data-slot="coverflow-flip-trigger"');
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain("width:320px");
    expect(markup).not.toContain("itemSize");
    expect(markup).not.toContain('data-slot="coverflow-close-trigger"');
  });
});
