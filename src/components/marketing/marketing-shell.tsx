import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return <><MarketingHeader /><main id="main-content">{children}</main><MarketingFooter /></>;
}
