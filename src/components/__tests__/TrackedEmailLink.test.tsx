import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TrackedEmailLink } from "@/components/TrackedEmailLink";
import * as analytics from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackShopClick: vi.fn(),
  trackInstagramClick: vi.fn(),
  trackNavClick: vi.fn(),
  trackEmailClick: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

describe("TrackedEmailLink", () => {
  it("renders a link with the correct mailto href", () => {
    render(<TrackedEmailLink />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "mailto:contact@augustjones.shop");
  });

  it("calls trackEmailClick when the link is clicked", async () => {
    const user = userEvent.setup();
    render(<TrackedEmailLink />);
    const link = screen.getByRole("link");
    await user.click(link);
    expect(analytics.trackEmailClick).toHaveBeenCalled();
  });
});
