import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Header from "./header";

function renderHeader(isMobileMenuOpen = false) {
  const setIsMobileMenuOpen = vi.fn();

  render(
    <MemoryRouter>
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
    </MemoryRouter>,
  );

  return { setIsMobileMenuOpen };
}

describe("Header", () => {
  it("links the sidebar and mobile header logos to home", () => {
    renderHeader();

    const homeLinks = screen.getAllByRole("link", {
      name: "Go to BK UI home",
    });

    expect(homeLinks).toHaveLength(2);
    homeLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/");
    });
  });

  it("closes the mobile sidebar when its logo is used", () => {
    const { setIsMobileMenuOpen } = renderHeader(true);

    fireEvent.click(
      screen.getAllByRole("link", { name: "Go to BK UI home" })[0],
    );

    expect(setIsMobileMenuOpen).toHaveBeenCalledWith(false);
  });
});
