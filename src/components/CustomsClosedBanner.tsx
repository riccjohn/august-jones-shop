import Link from "next/link";
import { EMAIL_SIGNUP_ENABLED } from "@/lib/config";

interface CustomsClosedBannerProps {
  /**
   * Whether customs are currently closed.
   * The banner is only rendered when this is false.
   */
  isClosed: boolean;
}

export function CustomsClosedBanner({ isClosed }: CustomsClosedBannerProps) {
  if (!isClosed) {
    return null;
  }

  return (
    <div className="bg-foreground/90 text-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 sm:px-8">
        <p className="text-sm font-medium tracking-wide sm:text-base">
          {EMAIL_SIGNUP_ENABLED ? (
            <>
              Custom commissions are temporarily closed. Join my{" "}
              <Link
                href="/join"
                className="underline underline-offset-2 transition-colors duration-200 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-background focus-visible:ring-offset-foreground/90"
              >
                email list
              </Link>{" "}
              to get notified when they reopen.
            </>
          ) : (
            "Custom commissions are temporarily closed."
          )}
        </p>
      </div>
    </div>
  );
}
