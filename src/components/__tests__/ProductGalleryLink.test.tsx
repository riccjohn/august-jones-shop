import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProductGalleryLink } from "@/components/ProductGalleryLink";
import * as analytics from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackShopClick: vi.fn(),
  trackInstagramClick: vi.fn(),
  trackNavClick: vi.fn(),
  trackEmailClick: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

const mockProduct = {
  id: 1,
  title: "Vintage Hawks Hoodie",
  src: "/images/hawks-hoodie.jpg",
  alt: "Vintage Hawks Hoodie",
  href: "https://store.augustjones.shop/products/hawks-hoodie?utm_source=augustjones&utm_medium=website&utm_campaign=gallery",
  category: "hoodies",
};

describe("ProductGalleryLink", () => {
  it("renders an anchor pointing to the product href including UTM parameters", () => {
    render(<ProductGalleryLink product={mockProduct} index={0} />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    const href = link.getAttribute("href") ?? "";
    expect(href).toContain("https://store.augustjones.shop");
    expect(href).toContain("utm_source=augustjones");
    expect(href).toContain("utm_medium=website");
    expect(href).toContain("utm_campaign=gallery");
  });

  it("calls trackShopClick with a source prefixed 'gallery_' and the product category when clicked", async () => {
    const user = userEvent.setup();
    render(<ProductGalleryLink product={mockProduct} index={0} />);
    const link = screen.getByRole("link");
    await user.click(link);
    expect(analytics.trackShopClick).toHaveBeenCalledWith(
      `gallery_${mockProduct.category}`,
    );
  });
});
