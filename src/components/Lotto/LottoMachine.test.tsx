import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LottoMachine } from "./LottoMachine";

describe("LottoMachine", () => {
  it("renders a capped decorative pool and accessible results", () => {
    const { container } = render(
      <LottoMachine
        items={[
          { id: "a", label: "Alpha" },
          { id: "b", label: "Beta" },
          { id: "c", label: "Gamma" },
          { id: "d", label: "Delta" },
        ]}
        drawnItems={[
          { id: "a", label: "Alpha" },
          { id: "b", label: "Beta" },
        ]}
        maxVisibleBalls={3}
        getItemKey={(item) => item.id}
        getItemLabel={(item) => item.label}
        renderBall={(item) => <strong>{item.label}</strong>}
        resultLabel="Selected balls"
      />,
    );

    expect(
      container.querySelectorAll('[data-slot="lotto-machine-ball"]'),
    ).toHaveLength(3);
    expect(
      container.querySelector('[data-slot="lotto-machine-balls"]'),
    ).toHaveAttribute("aria-hidden", "true");

    const results = screen.getByRole("list", { name: "Selected balls" });
    expect(within(results).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Draw complete: Alpha, Beta",
    );
  });

  it("exposes its spinning state and allows style overrides", () => {
    const { container } = render(
      <LottoMachine
        items={[1, 2, 3]}
        spinning
        aria-label="Custom lotto machine"
        className="p-2"
        ballClassName="bg-fuchsia-500"
      />,
    );

    const machine = screen.getByRole("region", {
      name: "Custom lotto machine",
    });
    expect(machine).toHaveAttribute("data-state", "spinning");
    expect(machine).toHaveAttribute("aria-busy", "true");
    expect(machine).toHaveClass("p-2");
    expect(machine).not.toHaveClass("p-4");
    expect(
      container.querySelector('[data-slot="lotto-machine-balls"]'),
    ).toHaveClass("motion-safe:animate-[spin_2.8s_linear_infinite]");
    expect(
      container.querySelector('[data-slot="lotto-machine-ball"]'),
    ).toHaveClass("bg-fuchsia-500");
  });
});
