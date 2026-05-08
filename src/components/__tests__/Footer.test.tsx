import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Footer } from "@/components/Footer";

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

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...rest
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} />,
}));

vi.mock("@/components/FooterShopLink", () => ({
  FooterShopLink: () => <a href="https://store.augustjones.shop">Shop Now</a>,
}));

vi.mock("@/components/InstagramLink", () => ({
  InstagramLink: ({ children }: { children: React.ReactNode }) => (
    <a href="https://instagram.com/augustjonesshop">{children}</a>
  ),
}));

vi.mock("@/components/TrackedEmailLink", () => ({
  TrackedEmailLink: () => (
    <a href="mailto:contact@augustjones.shop">contact@augustjones.shop</a>
  ),
}));

describe("Footer", () => {
  it("contains a link to /events in the footer navigation", () => {
    render(<Footer />);
    const nav = screen.getByRole("navigation", {
      name: "Footer navigation",
    });
    const eventsLink = within(nav).getByRole("link", { name: /events/i });
    expect(eventsLink).toBeInTheDocument();
    expect(eventsLink).toHaveAttribute("href", "/events");
  });

  it("contains a link to /about in the footer navigation", () => {
    render(<Footer />);
    const nav = screen.getByRole("navigation", {
      name: "Footer navigation",
    });
    const aboutLink = within(nav).getByRole("link", { name: /about/i });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  it("contains a link to /contact in the footer navigation", () => {
    render(<Footer />);
    const nav = screen.getByRole("navigation", {
      name: "Footer navigation",
    });
    const contactLink = within(nav).getByRole("link", { name: /contact/i });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute("href", "/contact");
  });
});
