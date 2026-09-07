import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("@/components/GrainOverlay", () => ({
  GrainOverlay: () => <div data-testid="grain-overlay" />,
}));

import SizingPage from "../page";

describe("Sizing Page", () => {
  it("renders the page heading", () => {
    render(<SizingPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /size chart/i }),
    ).toBeInTheDocument();
  });

  it("renders a Cropped Military Jacket size table with S/M/L/XL rows", () => {
    render(<SizingPage />);
    const table = screen.getByRole("table", {
      name: /cropped military jacket/i,
    });
    expect(table).toBeInTheDocument();
    expect(within(table).getByText("S")).toBeInTheDocument();
    expect(within(table).getByText("M")).toBeInTheDocument();
    expect(within(table).getByText("L")).toBeInTheDocument();
    expect(within(table).getByText("XL")).toBeInTheDocument();
  });

  it("renders a Vest size table with Cropped and Full Length columns", () => {
    render(<SizingPage />);
    const table = screen.getByRole("table", { name: /^vest/i });
    expect(table).toBeInTheDocument();
    expect(within(table).getAllByText(/cropped/i).length).toBeGreaterThan(0);
    expect(within(table).getAllByText(/full length/i).length).toBeGreaterThan(
      0,
    );
  });

  it("links back to the contact page for sizing questions", () => {
    render(<SizingPage />);
    const contactLink = screen.getByRole("link", { name: /get in touch/i });
    expect(contactLink).toHaveAttribute("href", "/contact");
  });
});
